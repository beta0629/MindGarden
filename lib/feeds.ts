import { homeCopy } from './content/home';
import { SITE } from './site';

export type FeedVideo = {
  id: string;
  title: string;
  thumb: string;
  url: string;
};

export type FeedBlogPost = {
  title: string;
  date: string;
  url: string;
  thumb: string | null;
};

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

/** Highest-res first; each step falls back when the file is missing (404). */
const YOUTUBE_THUMB_VARIANTS = [
  'maxresdefault',
  'sddefault',
  'hqdefault',
] as const;
const THUMB_PROBE_TIMEOUT_MS = 2500;

async function resolveYoutubeThumb(id: string): Promise<string> {
  const urlFor = (variant: string) =>
    `https://i.ytimg.com/vi/${id}/${variant}.jpg`;
  // hqdefault always exists — no probe needed for the last variant.
  for (const variant of YOUTUBE_THUMB_VARIANTS.slice(0, -1)) {
    try {
      const res = await fetch(urlFor(variant), {
        method: 'HEAD',
        signal: AbortSignal.timeout(THUMB_PROBE_TIMEOUT_MS),
        next: { revalidate: 86400 },
      });
      if (res.ok) return urlFor(variant);
    } catch {
      // try the next variant
    }
  }
  return urlFor('hqdefault');
}

export async function getLatestVideos(limit = 3): Promise<FeedVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${SITE.youtubeChannelId}`;
  try {
    const res = await fetch(feedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('youtube rss failed');
    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(
      0,
      limit,
    );
    const parsed = entries
      .map((match) => {
        const block = match[1];
        const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        const titleRaw = block.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
        if (!id) return null;
        const title = titleRaw.split('|')[0]?.replace(/#shorts/gi, '').trim();
        return {
          id,
          title: title || titleRaw,
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter((v): v is Omit<FeedVideo, 'thumb'> => Boolean(v));
    const videos: FeedVideo[] = await Promise.all(
      parsed.map(async (v) => ({ ...v, thumb: await resolveYoutubeThumb(v.id) })),
    );
    if (videos.length > 0) return videos;
  } catch {
    // fall through
  }
  return homeCopy.fallbackVideos.map((v) => ({
    id: v.id,
    title: v.title,
    thumb: v.thumb,
    url: `https://www.youtube.com/watch?v=${v.id}`,
  }));
}

export async function getLatestBlogPosts(
  limit = 3,
): Promise<FeedBlogPost[]> {
  try {
    const res = await fetch(SITE.blogRssUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('blog rss failed');
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(
      0,
      limit,
    );
    const posts = items
      .map((match) => {
        const block = match[1];
        const title = stripCdata(
          block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '',
        );
        const url = stripCdata(
          block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '',
        );
        const dateRaw =
          block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '';
        const date = dateRaw
          ? new Date(dateRaw).toISOString().slice(0, 10)
          : '';
        const thumb =
          block.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] ??
          block.match(/<media:content[^>]+url="([^"]+)"/)?.[1] ??
          null;
        if (!title || !url) return null;
        return { title, date, url, thumb };
      })
      .filter((p): p is FeedBlogPost => Boolean(p));
    if (posts.length > 0) return posts;
  } catch {
    // fall through
  }
  return homeCopy.fallbackBlog.map((p) => ({ ...p }));
}
