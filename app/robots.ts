import type { MetadataRoute } from 'next';
import { getSiteUrl, isSiteIndexable } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  if (!isSiteIndexable()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
