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
    const videos = entries
      .map((match) => {
        const block = match[1];
        const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        const titleRaw = block.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
        if (!id) return null;
        const title = titleRaw.split('|')[0]?.replace(/#shorts/gi, '').trim();
        return {
          id,
          title: title || titleRaw,
          thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter((v): v is FeedVideo => Boolean(v));
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
