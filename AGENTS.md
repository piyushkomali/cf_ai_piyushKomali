# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

This repo has two sub-projects:
1. **Root (`/workspace`)** – Cloudflare Workers shopping list app (main product). Uses npm and `wrangler`.
2. **`/workspace/next`** – Standalone Next.js scaffold (unrelated to main app). Uses pnpm.

### Running the Main App (Cloudflare Workers)

```bash
# From /workspace
CLOUDFLARE_API_TOKEN=dummy npx wrangler dev --port 8787 --show-interactive-dev-session false
```

- The `CLOUDFLARE_API_TOKEN=dummy` bypasses the OAuth login prompt. Without it, wrangler blocks waiting for browser-based OAuth.
- The Durable Object (WebSocket state + shopping list) runs fully locally. No external DB needed.
- The AI feature (`/process-command` endpoint using Workers AI) requires a real `CLOUDFLARE_API_TOKEN`. Without one, the rest of the app still works (add/remove/clear items via WebSocket).
- Frontend is served from `./public` at the root URL.

### Running the Next.js Scaffold

```bash
# From /workspace/next
pnpm dev --port 3000
```

### Lint / Type Check

- Next.js ESLint: `cd next && pnpm lint`
- Next.js TypeScript: `cd next && npx tsc --noEmit`
- The root Cloudflare Workers project has no configured linter or test runner.

### Build

- Next.js: `cd next && pnpm build`
- Wrangler (production deploy): `npx wrangler deploy` (requires auth)

### Key Gotchas

- The Durable Object binding in `wrangler.toml` uses `script_name = "cf-ai-shopping-list"` (self-reference). Wrangler shows `[not connected]` in local mode, but the DO still works locally.
- The AI binding always accesses remote Cloudflare resources. Set `CLOUDFLARE_API_TOKEN` to a valid token if you need to test AI-powered ingredient extraction.
- The Next.js project uses Turbopack by default in dev mode.
