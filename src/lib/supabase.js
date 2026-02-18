import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for TattooNOW Weekly Show
 *
 * Environment variables needed:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key (public, safe for client)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Slideshow doesn't need auth session
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} else {
  console.warn('Supabase credentials not found. Using JSON fallback only. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export { supabase };

/**
 * Fetch full episode data by episode number
 * Uses the get_episode_full() database function for optimized query
 */
export async function getEpisode(episodeNumber) {
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }
  try {
    const { data, error } = await supabase.rpc('get_episode_full', {
      episode_num: episodeNumber,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching episode:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch episode with segments and guests (manual query version)
 * Alternative to get_episode_full() if needed
 */
export async function getEpisodeWithSegments(episodeNumber) {
  try {
    // Fetch episode
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('episode_number', episodeNumber)
      .single();

    if (episodeError) throw episodeError;

    // Fetch segments with guest info
    const { data: segments, error: segmentsError } = await supabase
      .from('segments')
      .select(`
        *,
        guest:guests(*)
      `)
      .eq('episode_id', episode.id)
      .order('segment_number');

    if (segmentsError) throw segmentsError;

    return {
      data: {
        ...episode,
        segments,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching episode with segments:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Subscribe to episode updates (real-time)
 * For future live feed functionality
 */
export function subscribeToEpisode(episodeNumber, callback) {
  const subscription = supabase
    .channel(`episode-${episodeNumber}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'episodes',
        filter: `episode_number=eq.${episodeNumber}`,
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Subscribe to segment updates (real-time)
 */
export function subscribeToSegments(episodeId, callback) {
  const subscription = supabase
    .channel(`segments-${episodeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'segments',
        filter: `episode_id=eq.${episodeId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Insert analytics data
 */
export async function insertAnalytics(episodeId, platform, data) {
  try {
    const { error } = await supabase.from('analytics').insert({
      episode_id: episodeId,
      platform,
      ...data,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error inserting analytics:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all episodes (for content calendar, admin panel)
 */
export async function getAllEpisodes(status = null) {
  try {
    let query = supabase
      .from('episodes')
      .select('*')
      .order('air_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Get all guests (for guest database)
 */
export async function getAllGuests() {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching guests:', error);
    return { data: null, error: error.message };
  }
}

export default supabase;
