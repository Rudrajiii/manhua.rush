import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://manhuarush.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://manhuarush.vercel.app/ttp-providence',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ]
}
