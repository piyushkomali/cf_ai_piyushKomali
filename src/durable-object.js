import { DurableObject } from "cloudflare:workers";

const LOG_PREFIX = "[ShoppingList]";

//logging helper
function truncate(str, max = 200) {
  if (typeof str !== "string") return str;
  return str.length <= max ? str : `${str.slice(0, max)}...`;
}

export class ShoppingList extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.items = [];

    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get("items");
      this.items = stored || [];
      this._log("do_init", {
        itemCount: this.items.length,
      });
    });
  }

  _log(event, data = {}) {
    console.log(LOG_PREFIX, JSON.stringify({ event, ...data }));
  }

  _socketSnapshot() {
    const sockets = this.ctx.getWebSockets();
    return {
      activeSockets: sockets.length,
      sockets: sockets.map((w, i) => ({ i, readyState: w.readyState })),
    };
  }

  async handleSession(server) {
    this.ctx.acceptWebSocket(server);
    this._log("ws_accepted", {
      ...this._socketSnapshot(),
      itemCount: this.items.length,
    });

    await this.updateSessionCountUI();

    server.send(
      JSON.stringify({
        type: "updatedList",
        data: this.items,
      }),
    );
  }

  broadcast(message) {
    for (const session of this.ctx.getWebSockets()) {
      try {
        session.send(message);
      } catch {
        // drop dead sockets silently, same idea as the old sessions.filter
      }
    }
  }

  async updateSessionCountUI() {
    const count = this.ctx.getWebSockets().length;
    this._log("session_count_broadcast", { activeSockets: count });
    this.broadcast(
      JSON.stringify({
        type: "sessionCount",
        data: count,
      }),
    );
  }

  async updateAndBroadcast() {
    await this.ctx.storage.put("items", this.items);
    this._log("storage_updated", { itemCount: this.items.length });
    this.broadcast(
      JSON.stringify({
        type: "updatedList",
        data: this.items,
      }),
    );
  }

  async handleMessage(message) {
    const { action, payload } = message;
    this._log("handle_message", {
      action,
      payloadPreview: truncate(JSON.stringify(payload)),
    });
    switch (action) {
      case "addItem":
        if (typeof payload === "string" && payload.trim()) {
          this.items.push(payload.trim());
          await this.updateAndBroadcast();
        }
        break;

      case "addItems": {
        let list = payload;
        if (typeof payload === "string") {
          try {
            list = JSON.parse(payload);
          } catch {
            break;
          }
        }
        if (Array.isArray(list)) {
          const validItems = list
            .filter((item) => typeof item === "string" && item.trim())
            .map((item) => item.trim());
          this.items.push(...validItems);
          await this.updateAndBroadcast();
        }
        break;
      }

      case "removeItem":
        if (typeof payload === "string") {
          const index = this.items.indexOf(payload);
          if (index > -1) {
            this.items.splice(index, 1);
            await this.updateAndBroadcast();
          }
        }
        break;

      case "clearList":
        this.items = [];
        await this.updateAndBroadcast();
        break;

      default:
        console.warn(LOG_PREFIX, "Unknown action:", action);
    }

    this._log("handle_message_done", { action });
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string") {
      return;
    }

    try {
      const data = JSON.parse(message);
      await this.handleMessage(data);
    } catch (err) {
      console.error(LOG_PREFIX, "Error handling message:", err);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }),
      );
    }
  }

  async webSocketClose(_ws, code, reason, _wasClean) {
    // Reciprocate close first (compat_date < 2026-04-07), then broadcast so
    // getWebSockets() reflects the disconnected client.
    _ws.close(code, reason);
    await this.updateSessionCountUI();
  }

  async webSocketError(_ws, error) {
    console.error(LOG_PREFIX, "WebSocket error:", error);
    await this.updateSessionCountUI();
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      this._log("fetch_websocket_upgrade", { pathname: url.pathname });
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      const activeSockets = this.ctx.getWebSockets().length;
      this._log("fetch_get_root", {
        itemCount: this.items.length,
        activeSockets,
      });
      return new Response(
        JSON.stringify({
          items: this.items,
          sessions: activeSockets,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (request.method === "POST") {
      try {
        const data = await request.json();
        await this.handleMessage(data);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}
