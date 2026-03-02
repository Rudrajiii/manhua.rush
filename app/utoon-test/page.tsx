import React from 'react';

export default function UtoonTestPage() {
  const imgPath = 'wp-content/uploads/WP-manga/data/manga_6901cc7951fa6/c1dc27194e06ba981410892798cf2488/05.jpg';

  // Single efficient streaming proxy endpoint (appears to come from our site)
  const proxyUrl = `/api/utoon-proxy/${imgPath}`;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 420 }}>
        <div style={{ border: '1px solid #ddd', padding: 8 }}>
          <img src={proxyUrl} alt="utoon proxied" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
