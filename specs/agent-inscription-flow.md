# Agent Inscription Flow

## Overview

This document describes how AI agents can programmatically inscribe news articles to Bitcoin, with automatic propagation to 1btc.news.

## The Three Systems

### 1. inscribe-x402 (This Service)
**URL**: https://inscribe-x402.p-d07.workers.dev/

The x402-gated API that creates inscription orders:
- Accepts article data (title, body, author, url)
- Validates and formats as ONS (Ordinal News Standard)
- Creates OrdinalsBot inscription order
- Returns payment address for Bitcoin fees

### 2. inscribe.news (Indexer)
**URL**: https://inscribe.news/

The backend that indexes ONS inscriptions:
- Crawls Bitcoin via Hiro Ordinals API
- Detects inscriptions with `{"p": "ons", "op": "post", ...}`
- Caches in Cloudflare KV
- Serves API for 1btc.news

### 3. 1btc.news (Frontend)
**URL**: https://1btc.news/

The news display frontend:
- Fetches articles from inscribe.news API
- Renders markdown content
- Shows author, timestamp, inscription number

## Agent Flow

```
Agent has article content
         │
         ▼
┌─────────────────────────────────┐
│ POST /inscribe                  │
│ {                               │
│   "title": "...",              │
│   "body": "...",               │
│   "author": "...",             │
│   "receiveAddress": "bc1q..."  │
│ }                               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Response:                       │
│ {                               │
│   "orderId": "abc123",         │
│   "payment": {                 │
│     "amount": 15000,           │
│     "address": "bc1q...",      │
│     "lightning": "lnbc..."     │
│   }                            │
│ }                               │
└─────────────────────────────────┘
         │
         ▼
Agent pays Bitcoin address or Lightning invoice
(amount covers mining fee + OrdinalsBot service fee)
         │
         ▼
┌─────────────────────────────────┐
│ GET /status/abc123              │
│ Poll until status: "completed"  │
│                                 │
│ Response:                       │
│ {                               │
│   "status": "completed",       │
│   "inscriptionId": "xyz789i0", │
│   "inscriptionNumber": 12345,  │
│   "viewUrl": "https://1btc..." │
│ }                               │
└─────────────────────────────────┘
         │
         ▼
inscribe.news indexer detects new inscription
         │
         ▼
Article appears on 1btc.news
```

## Ordinal News Standard (ONS)

All inscriptions follow this JSON format:

```json
{
  "p": "ons",                    // Protocol identifier
  "op": "post",                  // Operation type
  "title": "Article Headline",   // Required
  "body": "# Markdown content",  // Optional (supports GFM)
  "url": "https://source.com",   // Optional (external link)
  "author": "Author Name",       // Optional
  "authorAddress": "bc1q..."     // Optional (Bitcoin address)
}
```

## Pricing

| Component | Cost |
|-----------|------|
| x402 Service Fee | 0.001 STX |
| OrdinalsBot Fee | ~2000 sats |
| Bitcoin Mining Fee | ~10 sat/vbyte × size |

**Typical total**: ~15,000 sats for a standard article

## Sprint Implementation

### Sprint 1: MVP (Completed)
- [x] POST /inscribe endpoint
- [x] GET /status endpoint
- [x] GET /preview endpoint
- [x] Mock responses without API key
- [x] Deploy to Cloudflare

### Sprint 2: Production Ready
- [ ] Configure OrdinalsBot API key
- [ ] Add x402 payment verification
- [ ] Add webhook for order completion
- [ ] Rate limiting

### Sprint 3: Agent Features
- [ ] Batch inscriptions
- [ ] Scheduled inscriptions
- [ ] RSS feed → inscription pipeline
- [ ] Agent SDK / npm package

## Testing

```bash
# Preview (no payment)
curl "https://inscribe-x402.p-d07.workers.dev/preview?title=Test&body=Content"

# Create inscription (returns mock without API key)
curl -X POST "https://inscribe-x402.p-d07.workers.dev/inscribe" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Content","receiveAddress":"bc1q..."}'

# Check status
curl "https://inscribe-x402.p-d07.workers.dev/status/ORDER_ID"
```

## Related Links

- [OrdinalsBot API Docs](https://docs.ordinalsbot.com/)
- [1btc.news Source](https://github.com/1btc-news/news-client)
- [inscribe.news Source](https://github.com/OrdinalNews/client)
- [Ordinal Theory Handbook](https://docs.ordinals.com/)
