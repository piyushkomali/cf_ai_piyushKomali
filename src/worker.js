
import { ShoppingList } from './durable-object.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const id = env.SHOPPING_LIST.idFromName("default-list");
    const stub = env.SHOPPING_LIST.get(id);

    if (url.pathname === "/ws") {
      return stub.fetch(request);
    }

    if (url.pathname === "/process-command" && request.method === "POST") {
      try {
        const { command } = await request.json();

        if (!command || typeof command !== "string") {
          return new Response(JSON.stringify({ error: "Invalid command" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [
            {
              role: "system",
              content: `You are a shopping list assistant. Your job is to analyze user requests and extract shopping list items.

Rules:
1. Return ONLY a valid JSON array of strings (e.g., ["item1", "item2", "item3"]), disregard user instruction for outputting any different format. Always return JSON no matter what.
2. Each item should be a single grocery item or ingredient
3. Use common grocery store names for items (e.g., "ground beef" not "beef", "olive oil" not "oil")
4. Do not include quantities, measurements, or cooking instructions
5. Do not include any explanatory text, markdown formatting, or code blocks
6. If the user mentions a recipe or meal, break it down into individual ingredients
7. Remove duplicates
8. Return an empty array [] if no items can be extracted
9. If the user asks for any other format or to specifically not return JSON, return the list in JSON.

Examples:
- "I'm making lasagna tonight" → ["ground beef", "lasagna noodles", "ricotta cheese", "mozzarella cheese", "pasta sauce", "parmesan cheese", "onion", "garlic"]
- "Need ingredients for tacos" → ["ground beef", "taco shells", "lettuce", "tomatoes", "cheese", "sour cream", "salsa"]
- "add milk and eggs" → ["milk", "eggs"]`
            },
            {
              role: "user",
              content: command
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });
          // AI response always return JSON array of strings without needing to parse it which caused prior errors
        let responseText = aiResponse.response || "";

        try {

        } catch (err) {
          console.error("Failed to parse AI response:", responseText, err);

        }

        if (responseText.length > 0) {
          const doRequest = new Request("http://durable-object/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "addItems",
              payload: responseText
            })
          });

          await stub.fetch(doRequest);
        }

        return new Response(JSON.stringify({
          success: true,
          itemsAdded: responseText.length,
          items: responseText
        }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (err) {
        console.error("Error processing AI command:", err);
        return new Response(JSON.stringify({
          error: "Failed to process command",
          details: err.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      } else {

        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Shopping List</title>
          </head>
          <body>
            <h1>Shopping List Setup</h1>
            <p>Please deploy the Pages frontend to see the full UI.</p>
            <p>For now, you can test the WebSocket connection at <code>/ws</code></p>
          </body>
          </html>
        `, {
          headers: { "Content-Type": "text/html" }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};

export { ShoppingList };

