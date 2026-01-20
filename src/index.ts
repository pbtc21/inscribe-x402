import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  ORDINALSBOT_API_KEY?: string
  RECEIVE_ADDRESS?: string  // Default Bitcoin address to receive inscriptions
}

type OrdinalNewsPayload = {
  p: 'ons'
  op: 'post'
  title: string
  url?: string
  body?: string
  author?: string
  authorAddress?: string
}

type InscribeRequest = {
  title: string
  body?: string
  url?: string
  author?: string
  authorAddress?: string
  receiveAddress?: string  // Override default receive address
  fee?: number             // Sats/vbyte (default: 10)
}

type OrdinalsOrderResponse = {
  status: string
  id?: string
  charge?: {
    amount: number
    address?: string
    lightning_invoice?: string
  }
  chainFee?: number
  serviceFee?: number
  error?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/*', cors())

// Homepage
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Inscribe x402 - Bitcoin News Inscriptions</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e0e0e0; }
    h1 { color: #f7931a; }
    h2 { color: #f7931a; border-bottom: 1px solid #333; padding-bottom: 10px; }
    code { background: #1a1a1a; padding: 2px 6px; border-radius: 4px; color: #f7931a; }
    pre { background: #1a1a1a; padding: 15px; border-radius: 8px; overflow-x: auto; border: 1px solid #333; }
    a { color: #f7931a; }
    .endpoint { background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #f7931a; }
    .method { font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
    .post { background: #2d5016; color: #90EE90; }
    .get { background: #164050; color: #87CEEB; }
    .flow { background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .flow-step { display: flex; align-items: center; margin: 10px 0; }
    .step-num { background: #f7931a; color: black; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; }
  </style>
</head>
<body>
  <h1>⚡ Inscribe x402</h1>
  <p>Inscribe news articles to Bitcoin, propagate to <a href="https://1btc.news">1btc.news</a> automatically.</p>

  <h2>How It Works</h2>
  <div class="flow">
    <div class="flow-step">
      <span class="step-num">1</span>
      <span>POST your article to <code>/inscribe</code> (x402 payment covers service fee)</span>
    </div>
    <div class="flow-step">
      <span class="step-num">2</span>
      <span>Receive Bitcoin payment address for inscription fees</span>
    </div>
    <div class="flow-step">
      <span class="step-num">3</span>
      <span>Pay the address (or Lightning invoice) to fund inscription</span>
    </div>
    <div class="flow-step">
      <span class="step-num">4</span>
      <span>Article inscribed to Bitcoin blockchain</span>
    </div>
    <div class="flow-step">
      <span class="step-num">5</span>
      <span>Appears on <a href="https://1btc.news">1btc.news</a> automatically via indexer</span>
    </div>
  </div>

  <h2>API Endpoints</h2>

  <div class="endpoint">
    <span class="method post">POST</span><code>/inscribe</code>
    <p>Create an inscription order for a news article.</p>
    <p><strong>x402 Price:</strong> 0.001 STX (service fee)</p>
    <p><strong>Request Body:</strong></p>
    <pre>{
  "title": "Your Article Title",      // Required
  "body": "# Markdown content...",    // Optional (markdown supported)
  "url": "https://source.com/article",// Optional (external link)
  "author": "Your Name",              // Optional
  "authorAddress": "bc1q...",         // Optional (Bitcoin address)
  "receiveAddress": "bc1q...",        // Optional (where to receive inscription)
  "fee": 10                           // Optional (sats/vbyte, default: 10)
}</pre>
    <p><strong>Response:</strong></p>
    <pre>{
  "success": true,
  "orderId": "abc123-def456",
  "payment": {
    "amount": 12500,                  // Satoshis to pay
    "address": "bc1q...",             // Bitcoin address
    "lightning": "lnbc..."            // Lightning invoice
  },
  "inscription": {
    "receiveAddress": "bc1q...",
    "content": { ... }                // ONS payload that will be inscribed
  },
  "statusUrl": "/status/abc123-def456"
}</pre>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span><code>/status/:orderId</code>
    <p>Check the status of an inscription order.</p>
    <p><strong>Response:</strong></p>
    <pre>{
  "orderId": "abc123-def456",
  "status": "waiting-payment" | "payment-received" | "inscribing" | "completed" | "failed",
  "inscriptionId": "abc123i0",        // Only when completed
  "inscriptionNumber": 12345678,      // Only when completed
  "viewUrl": "https://1btc.news/view-news?id=12345678"
}</pre>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span><code>/preview</code>
    <p>Preview what the inscription JSON will look like (no payment required).</p>
    <pre>GET /preview?title=Test&body=Content&author=Me</pre>
  </div>

  <h2>Ordinal News Standard (ONS)</h2>
  <p>All inscriptions follow the <a href="https://github.com/1btc-news/news-client">Ordinal News Standard</a>:</p>
  <pre>{
  "p": "ons",           // Protocol identifier
  "op": "post",         // Operation type
  "title": "...",       // Article headline
  "body": "...",        // Markdown content
  "url": "...",         // External source link
  "author": "...",      // Author name
  "authorAddress": "..."// Bitcoin address
}</pre>

  <h2>Agent Integration</h2>
  <p>For AI agents, use the x402 protocol to pay and inscribe in a single flow:</p>
  <pre>// Agent workflow
const response = await fetch('https://inscribe-x402.p-d07.workers.dev/inscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-402-Payment': '...'  // x402 payment header
  },
  body: JSON.stringify({
    title: 'Breaking: AI Agents Can Now Inscribe News',
    body: 'Article content here...',
    author: 'AI Agent'
  })
});

const { orderId, payment } = await response.json();
// Agent then pays payment.lightning or payment.address</pre>

  <h2>Links</h2>
  <ul>
    <li><a href="https://1btc.news">1btc.news</a> - View inscribed news</li>
    <li><a href="https://inscribe.news">inscribe.news</a> - Inscription indexer</li>
    <li><a href="https://ordinalsbot.com">OrdinalsBot</a> - Inscription infrastructure</li>
  </ul>

  <p style="color: #666; margin-top: 40px; text-align: center;">
    Powered by <a href="https://ordinalsbot.com">OrdinalsBot</a> |
    Built for <a href="https://1btc.news">1btc.news</a>
  </p>
</body>
</html>`
  return c.html(html)
})

// Preview endpoint - generate ONS payload without inscribing
app.get('/preview', (c) => {
  const title = c.req.query('title')
  const body = c.req.query('body')
  const url = c.req.query('url')
  const author = c.req.query('author')
  const authorAddress = c.req.query('authorAddress')

  if (!title) {
    return c.json({ error: 'title is required' }, 400)
  }

  if (!body && !url) {
    return c.json({ error: 'body or url is required' }, 400)
  }

  const payload: OrdinalNewsPayload = {
    p: 'ons',
    op: 'post',
    title
  }

  if (body) payload.body = body
  if (url) payload.url = url
  if (author) payload.author = author
  if (authorAddress) payload.authorAddress = authorAddress

  return c.json({
    onsPayload: payload,
    contentType: 'application/json',
    sizeBytes: new TextEncoder().encode(JSON.stringify(payload)).length
  })
})

// Main inscription endpoint
app.post('/inscribe', async (c) => {
  // x402 payment validation would go here
  // For now, we'll process all requests

  const req = await c.req.json<InscribeRequest>()

  // Validate required fields
  if (!req.title) {
    return c.json({ error: 'title is required' }, 400)
  }

  if (!req.body && !req.url) {
    return c.json({ error: 'body or url is required' }, 400)
  }

  // Build ONS payload
  const onsPayload: OrdinalNewsPayload = {
    p: 'ons',
    op: 'post',
    title: req.title
  }

  if (req.body) onsPayload.body = req.body
  if (req.url) onsPayload.url = req.url
  if (req.author) onsPayload.author = req.author
  if (req.authorAddress) onsPayload.authorAddress = req.authorAddress

  // Convert to data URL for OrdinalsBot
  const jsonContent = JSON.stringify(onsPayload)
  const base64Content = btoa(jsonContent)
  const dataUrl = `data:application/json;base64,${base64Content}`

  // Get receive address (from request or environment)
  const receiveAddress = req.receiveAddress || c.env.RECEIVE_ADDRESS
  if (!receiveAddress) {
    return c.json({
      error: 'receiveAddress is required (set in request or configure default)'
    }, 400)
  }

  // Check for API key
  const apiKey = c.env.ORDINALSBOT_API_KEY
  if (!apiKey) {
    // Return mock response for testing without API key
    return c.json({
      success: true,
      mock: true,
      message: 'OrdinalsBot API key not configured - returning mock response',
      orderId: `mock-${Date.now()}`,
      payment: {
        amount: 15000,
        address: 'bc1qmock...configure-api-key',
        lightning: 'lnbc150u1mock...configure-api-key'
      },
      inscription: {
        receiveAddress,
        content: onsPayload
      },
      statusUrl: `/status/mock-${Date.now()}`
    })
  }

  // Create OrdinalsBot order
  try {
    const orderResponse = await fetch('https://api.ordinalsbot.com/inscribe', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        receiveAddress,
        fee: req.fee || 10,
        files: [{
          name: 'news.json',
          size: jsonContent.length,
          dataURL: dataUrl
        }]
      })
    })

    const orderData = await orderResponse.json() as OrdinalsOrderResponse

    if (orderData.status === 'error') {
      return c.json({
        success: false,
        error: orderData.error || 'OrdinalsBot order creation failed'
      }, 500)
    }

    return c.json({
      success: true,
      orderId: orderData.id,
      payment: {
        amount: orderData.charge?.amount,
        address: orderData.charge?.address,
        lightning: orderData.charge?.lightning_invoice
      },
      fees: {
        chain: orderData.chainFee,
        service: orderData.serviceFee
      },
      inscription: {
        receiveAddress,
        content: onsPayload
      },
      statusUrl: `/status/${orderData.id}`
    })
  } catch (error) {
    return c.json({
      success: false,
      error: `OrdinalsBot API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500)
  }
})

// Status check endpoint
app.get('/status/:orderId', async (c) => {
  const orderId = c.req.param('orderId')

  // Handle mock orders
  if (orderId.startsWith('mock-')) {
    return c.json({
      orderId,
      mock: true,
      status: 'mock-order',
      message: 'This is a mock order. Configure ORDINALSBOT_API_KEY for real inscriptions.'
    })
  }

  const apiKey = c.env.ORDINALSBOT_API_KEY
  if (!apiKey) {
    return c.json({ error: 'OrdinalsBot API key not configured' }, 500)
  }

  try {
    const response = await fetch(`https://api.ordinalsbot.com/order?id=${orderId}`, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': apiKey
      }
    })

    const orderData = await response.json() as any

    if (orderData.status === 'error') {
      return c.json({
        orderId,
        status: 'error',
        error: orderData.error
      }, 404)
    }

    // Map OrdinalsBot status to our status
    let status = 'unknown'
    if (orderData.state === 'waiting-payment') status = 'waiting-payment'
    else if (orderData.state === 'payment-received') status = 'payment-received'
    else if (orderData.state === 'inscribing') status = 'inscribing'
    else if (orderData.state === 'completed') status = 'completed'
    else if (orderData.state === 'failed') status = 'failed'
    else status = orderData.state

    const result: any = {
      orderId,
      status,
      charge: orderData.charge
    }

    // Add inscription details if completed
    if (status === 'completed' && orderData.files?.[0]) {
      const file = orderData.files[0]
      result.inscriptionId = file.inscriptionId
      result.inscriptionNumber = file.inscriptionNumber
      result.viewUrl = `https://1btc.news/view-news?id=${file.inscriptionNumber}`
      result.ordinalUrl = `https://ordinals.com/inscription/${file.inscriptionId}`
    }

    return c.json(result)
  } catch (error) {
    return c.json({
      orderId,
      status: 'error',
      error: `Failed to fetch order status: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500)
  }
})

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'inscribe-x402',
    hasApiKey: !!c.env.ORDINALSBOT_API_KEY,
    hasReceiveAddress: !!c.env.RECEIVE_ADDRESS
  })
})

export default app
