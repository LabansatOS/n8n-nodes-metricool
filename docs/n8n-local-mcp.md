# Local n8n MCP (this project)

Project MCP server `n8n-local` is defined in [`.cursor/mcp.json`](../.cursor/mcp.json) and points at:

`http://localhost:5678/mcp-server/http`

It is separate from the global cloud `n8n-mcp` entry in `~/.cursor/mcp.json`.

## One-time setup

1. Start local n8n (`n8n start`) with this package linked.
2. In the UI: **Settings → Instance-level MCP** → enable MCP access.
3. Open **Connection details** → **Access Token** → copy the token (shown once).
4. Export it in your shell profile (or set it for the Cursor app environment):

```bash
export N8N_LOCAL_MCP_TOKEN='paste-token-here'
```

5. Fully quit and reopen Cursor (or reload the window) so the project MCP picks up the env var.
6. In **Cursor Settings → Tools & MCP**, confirm `n8n-local` is connected (green).

Then ask the agent to use **n8n-local** (not the cloud `n8n-mcp`) for workflows in this repo.
