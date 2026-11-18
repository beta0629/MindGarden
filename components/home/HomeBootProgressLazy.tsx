'use client';

/**
 * @deprecated Prefer static {@link HomeBootProgress} from SiteShell.
 * Kept as a thin re-export so any stale import still gets an eager bar
 * (dynamic-import deferral caused soft-GL to skip the first-entry bar).
 */
export { HomeBootProgress as HomeBootProgressLazy } from './HomeBootProgress';
