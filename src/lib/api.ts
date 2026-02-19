/**
 * Data layer for TattooNOW Show admin.
 *
 * v1: Reads from /public/data/ JSON files via fetch.
 * Write operations POST to a dev-server API (when available),
 * falling back to console warnings in production.
 */

import type { Tape, Show, TalentPool, ShowFormatsFile, ThemesSeasonsFile, Episode } from './types';

const BASE = import.meta.env.BASE_URL || '/';
const DATA_PATH = `${BASE}data`;

// ── Read operations (fetch JSON from public/data/) ───────────────────

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_PATH}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export async function listTapes(): Promise<Tape[]> {
  // Fetch the tape index, or fall back to fetching known tapes
  const knownTapes = [
    'tapes/tape-nikko-hurtado.json',
    'tapes/tape-shy-artist-text-qa.json',
    'tapes/tape-pricing-panel.json',
    'tapes/tape-pricing-education.json',
    'tapes/tape-who-tattooed-it.json',
    'tapes/tape-best-pricing-clips.json',
    'tapes/tape-villain-arts-miami.json',
  ];

  const results = await Promise.allSettled(
    knownTapes.map(path => fetchJSON<Tape>(path))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Tape> => r.status === 'fulfilled')
    .map(r => r.value);
}

export async function fetchTape(id: string): Promise<Tape> {
  // Try direct ID match first, then common patterns
  const paths = [
    `tapes/${id}.json`,
    `tapes/tape-${id}.json`,
  ];

  for (const path of paths) {
    try {
      return await fetchJSON<Tape>(path);
    } catch {
      continue;
    }
  }
  throw new Error(`Tape not found: ${id}`);
}

export async function listEpisodes(): Promise<Episode[]> {
  const knownEpisodes = [
    'episode-1.json',
    'episode-2.json',
    'episode-2-with-script.json',
    'episode-3-with-script.json',
  ];

  const results = await Promise.allSettled(
    knownEpisodes.map(path => fetchJSON<Episode>(path))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Episode> => r.status === 'fulfilled')
    .map(r => r.value);
}

export async function fetchEpisode(filename: string): Promise<Episode> {
  return fetchJSON<Episode>(`${filename}`);
}

export async function listShows(): Promise<Show[]> {
  const knownShows = [
    'shows/show-ep4-pricing.json',
    'shows/show-ep9-panel-pricing-debate.json',
  ];

  const results = await Promise.allSettled(
    knownShows.map(path => fetchJSON<Show>(path))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Show> => r.status === 'fulfilled')
    .map(r => r.value);
}

export async function fetchShow(id: string): Promise<Show> {
  const paths = [
    `shows/${id}.json`,
    `shows/show-${id}.json`,
  ];

  for (const path of paths) {
    try {
      return await fetchJSON<Show>(path);
    } catch {
      continue;
    }
  }
  throw new Error(`Show not found: ${id}`);
}

export async function fetchTalentPool(): Promise<TalentPool> {
  return fetchJSON<TalentPool>('talent-pool.json');
}

export async function fetchShowFormats(): Promise<ShowFormatsFile> {
  return fetchJSON<ShowFormatsFile>('show-formats.json');
}

export async function fetchThemesSeasons(): Promise<ThemesSeasonsFile> {
  return fetchJSON<ThemesSeasonsFile>('themes-seasons.json');
}

// ── Write operations (dev-only API) ──────────────────────────────────

const API_BASE = '/api/data';

async function writeJSON(path: string, data: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2),
    });
    return res.ok;
  } catch {
    console.warn(`[api] Write not available (dev API not running). Path: ${path}`);
    return false;
  }
}

export async function saveTape(id: string, data: Tape): Promise<boolean> {
  return writeJSON(`tapes/${id}.json`, data);
}

export async function saveShow(id: string, data: Show): Promise<boolean> {
  return writeJSON(`shows/${id}.json`, data);
}

export async function saveTalentPool(data: TalentPool): Promise<boolean> {
  return writeJSON('talent-pool.json', data);
}
