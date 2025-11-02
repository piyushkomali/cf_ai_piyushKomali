
export class ShoppingList {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.items = [];

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("items");
      this.items = stored || [];
    });
  }

  async handleSession(webSocket) {

    webSocket.accept();

    this.sessions.push(webSocket);

    webSocket.send(JSON.stringify({
      type: "updatedList",
      data: this.items
    }));

    webSocket.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        await this.handleMessage(data);
      } catch (err) {
        console.error("Error handling message:", err);
        webSocket.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });

    webSocket.addEventListener("close", () => {
      this.sessions = this.sessions.filter(session => session !== webSocket);
    });

    webSocket.addEventListener("error", () => {
      this.sessions = this.sessions.filter(session => session !== webSocket);
    });
  }

  broadcast(message) {

    this.sessions = this.sessions.filter(session => {
      try {
        session.send(message);
        return true;
      } catch (err) {

        return false;
      }
    });
  }

  async updateAndBroadcast() {

    await this.state.storage.put("items", this.items);

    this.broadcast(JSON.stringify({
      type: "updatedList",
      data: this.items
    }));
  }

  async handleMessage(message) {
    const { action, payload } = message;

    switch (action) {
      case "addItem":

        if (typeof payload === "string" && payload.trim()) {
          this.items.push(payload.trim());
          await this.updateAndBroadcast();
        }
        break;

      case "addItems":

        if (Array.isArray(payload)) {
          const validItems = payload
            .filter(item => typeof item === "string" && item.trim())
            .map(item => item.trim());
          this.items.push(...validItems);
          await this.updateAndBroadcast();
        }
        break;

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
        console.warn("Unknown action:", action);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      await this.handleSession(pair[1]);

      return new Response(null, {
        status: 101,
        webSocket: pair[0]
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(JSON.stringify({
        items: this.items,
        sessions: this.sessions.length
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      try {
        const data = await request.json();
        await this.handleMessage(data);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}

