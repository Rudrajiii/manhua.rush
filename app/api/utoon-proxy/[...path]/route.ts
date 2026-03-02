export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper: pick a proxy from env or defaults (comma-separated list)
function pickProxy() {
  const list = (process.env.PROXY_LIST || 'https://158.173.154.46:9002,https://158.173.154.53:9002')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path?.join('/') || '';

  if (!path) {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    const imageUrl = `https://utoon.net/${path}`;
    const upstream = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://utoon.net/',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response('Not found', { status: 404 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    // Stream the upstream response body directly to the client to avoid buffering
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Utoon streaming proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
