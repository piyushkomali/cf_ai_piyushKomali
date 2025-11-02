[![Visit Live App](https://img.shields.io/badge/_Visit_Live_App-4F46E5?style=for-the-badge&logo=cloudflare&logoColor=white)](https://shopping.piyushkomali.com/)
[![Portfolio](https://img.shields.io/badge/_My_Portfolio-4F46E5?style=for-the-badge&color=maroon&logo=nextjs&logoColor=blue)](https://piyushkomali.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-4F46E5?style=for-the-badge&color=blue&logo=linkedin&logoColor=blue)](https://www.linkedin.com/in/piyush-komali-53bb09240/)
[![GitHub](https://img.shields.io/badge/GitHub-4F46E5?style=for-the-badge&color=purple&logo=github&logoColor=qhite)](https://github.com/piyushkomali)


# real-time collaborative shopping list with AI enhancement

## what the application does

the application allows different clients/user to manage a SINGLE shopping list instance in real-time with the help of AI. using natural language users can simply add one item of their choice, remove an item, clear the list or use a more complex AI enhancement tool to add multiple items based on their prompt. The Workers backend with Workers AI and Durable Objects takes prompts like recipes, cuisines or anything the user thinks of and breaks it down into a JSON array of items via a system prompt.

## tech stack

- **frontend**: Cloudflare Pages with an HTML landing page with Tailwind CSS styling and JavaScript
- **real-time synchronization**: WebSockets
- **backend coordinator**: Cloudflare Workers
- **state management**: Cloudflare Durable Objects
- **ai processing**: Cloudflare Workers AI (cf/meta/llama-3.3-70b-instruct-fp8-fast)
- **deployment**: Wrangler CLI

## live prod deployment

[![Visit Live App](https://img.shields.io/badge/_Visit_Live_App-4F46E5?style=for-the-badge&logo=cloudflare&logoColor=white)](https://shopping.piyushkomali.com/)

**try it now:** [shopping.piyushkomali.com](https://shopping.piyushkomali.com/)

## running locally

to run this project locally, run the following commands:

1. install the dependencies

```bash
npm install
```

2. start the local worker server and a local durable object

```bash
npx wrangler dev
```

this command will:
- start a local worker server and a local durable object
- serve the frontend from the `public` directory
- enable websocket connections for real-time updates
- provide access to the workers ai model

open the local URL provided by Wrangler in your browser to access the application.


## how it works

1. **websocket connection**: the client connects to the websocket endpoint
2. **user input**: users type commands in the chat interface
3. **ai processing**: complex commands are processed by Workers AI (llama 3.3) to extract ingredients
4. **state management**: the durable object stores the shopping list and manages websocket connections
5. **real-time updates**: all clients receive instant updates when the list changes
6. **collaboration**: multiple users can view and modify the same list simultaneously

## features

- natural language item addition 
    - simple commands like add, remove (for specific items)
    - complex commands like "I am making Mexican food tonight, give me some items for tacos"
- real-time collaboration across multiple clients
- Workers AI 
- persistent SINGLE INSTANCE list via Durable Objects
- clean and modern UI with Tailwind CSS
- direct item removal
- clear entire list functionality

[![Portfolio](https://img.shields.io/badge/_My_Portfolio-4F46E5?style=for-the-badge&color=maroon&logo=nextjs&logoColor=blue)](https://piyushkomali.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-4F46E5?style=for-the-badge&color=blue&logo=linkedin&logoColor=blue)](https://www.linkedin.com/in/piyush-komali-53bb09240/)
[![GitHub](https://img.shields.io/badge/GitHub-4F46E5?style=for-the-badge&color=purple&logo=github&logoColor=qhite)](https://github.com/piyushkomali)