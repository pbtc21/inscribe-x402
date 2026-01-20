# Inscribe x402

x402 API for inscribing news articles to Bitcoin, with automatic propagation to 1btc.news.

## Overview

This service bridges the gap between AI agents and Bitcoin inscriptions:
1. Agent pays x402 service fee
2. Creates OrdinalsBot inscription order
3. Returns payment address for Bitcoin fees
4. Article inscribed to Bitcoin
5. Automatically appears on 1btc.news via inscribe.news indexer

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Inscription**: OrdinalsBot API
- **Protocol**: Ordinal News Standard (ONS)

## Environment Variables

```
ORDINALSBOT_API_KEY=    # Get from OrdinalsBot Discord
RECEIVE_ADDRESS=        # Default Bitcoin address for inscriptions
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Documentation |
| `/inscribe` | POST | Create inscription order (x402) |
| `/status/:orderId` | GET | Check order status |
| `/preview` | GET | Preview ONS payload |
| `/health` | GET | Health check |

## Deployment

```bash
# Install deps
bun install

# Local dev
bun run dev

# Deploy
CLOUDFLARE_API_TOKEN="..." bun run wrangler deploy
```

## Related Projects

- [1btc.news](https://github.com/1btc-news/news-client) - News display frontend
- [inscribe.news](https://github.com/OrdinalNews/client) - Inscription indexer
- [OrdinalsBot](https://docs.ordinalsbot.com/) - Inscription infrastructure
