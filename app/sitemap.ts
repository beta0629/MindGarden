import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

const ROUTES = [
  '/',
  '/about',
  '/counselors',
  '/guide',
  '/location',
  '/contact',
  '/counseling',
  '/counseling/children-adolescents',
  '/counseling/adults',
  '/counseling/overlapping-concerns',
  '/counseling/couples-family',
  '/faq',
  '/event',
  '/gallery',
  '/reviews',
  '/blog',
  '/videos',
  '/screening',
  '/privacy',
  '/terms',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${siteUrl}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
