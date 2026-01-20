# Inscribe x402

x402 API for inscribing news articles to Bitcoin, with automatic propagation to [1btc.news](https://1btc.news).

## Live

https://inscribe-x402.p-d07.workers.dev/

## How It Works

```
Agent/User                     inscribe-x402              OrdinalsBot           Bitcoin            1btc.news
    │                              │                          │                    │                   │
    │──POST /inscribe──────────────▶│                          │                    │                   │
    │                              │──Create order─────────────▶│                    │                   │
    │◀─Payment address─────────────│◀─Order + payment addr─────│                    │                   │
    │                              │                          │                    │                   │
    │──Pay Bitcoin/Lightning──────────────────────────────────────────────────────▶│                   │
    │                              │                          │──Inscribe──────────▶│                   │
    │                              │                          │                    │                   │
    │──GET /status─────────────────▶│                          │                    │                   │
    │◀─Inscription ID──────────────│◀─Completed────────────────│                    │                   │
    │                              │                          │                    │                   │
    │                              │                          │    (indexer discovers)                 │
    │                              │                          │                    │──────────────────▶│
    │                              │                          │                    │   Article live!   │
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Interactive documentation |
| `/inscribe` | POST | Create inscription order |
| `/status/:orderId` | GET | Check order status |
| `/preview` | GET | Preview ONS payload |
| `/health` | GET | Health check |

## Quick Start

```bash
# Preview what will be inscribed (free)
curl "https://inscribe-x402.p-d07.workers.dev/preview?title=My%20Article&body=Content"

# Create inscription order
curl -X POST "https://inscribe-x402.p-d07.workers.dev/inscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Inscription",
    "body": "# Hello Bitcoin\n\nThis article is now permanent.",
    "author": "Your Name",
    "receiveAddress": "bc1q..."
  }'
```

## Ordinal News Standard (ONS)

Content is formatted as ONS-compliant JSON:

```json
{
  "p": "ons",
  "op": "post",
  "title": "Article Title",
  "body": "Markdown content...",
  "url": "https://source.com",
  "author": "Author Name"
}
```

## Development

```bash
# Install
bun install

# Run locally
bun run dev

# Deploy
CLOUDFLARE_API_TOKEN="..." bun run wrangler deploy
```

## Configuration

Set in Cloudflare dashboard or `.dev.vars`:

```
ORDINALSBOT_API_KEY=your-api-key
RECEIVE_ADDRESS=bc1q...default-receive-address
```

## Architecture

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Inscription**: OrdinalsBot API
- **Indexer**: inscribe.news (auto-detects ONS inscriptions)
- **Display**: 1btc.news

## License

MIT
