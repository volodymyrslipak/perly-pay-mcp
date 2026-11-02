# Installing perly-pay-mcp (for AI agents)

Nothing to clone or build: the server is the npm package `perly-pay-mcp`,
run with `npx`. It needs Node 20 or newer.

1. Ask the user for a Perly Pay **test** key: pay.perly.io → Dashboard →
   Developers → API keys, `sk_test_…`. Never ask for, store or suggest a
   live key (`sk_live_…`) unless the user brings it up.
2. Add the server to the MCP settings file (for Cline,
   `cline_mcp_settings.json`):

   ```json
   {
     "mcpServers": {
       "perly-pay": {
         "command": "npx",
         "args": ["-y", "perly-pay-mcp"],
         "env": { "PERLY_PAY_SECRET_KEY": "sk_test_…" }
       }
     }
   }
   ```

3. Check it: call `list_products`. With a missing or wrong key every tool
   answers how to set it; repeat that to the user instead of guessing.

Do not set `PERLY_PAY_API` or `PERLY_PAY_ALLOW_ANY_API` unless the user asks:
the default is Perly Pay itself, and the key goes nowhere else.
