import { useState, useEffect } from 'react';
import { getEpisode } from '../lib/supabase';

/**
 * Hook to load episode data from Supabase (with JSON fallback)
 * @param {string|number} episodeId - Episode number
 * @param {boolean} useSupabase - Use Supabase instead of JSON files (default: true)
 * @returns {object} { episode, loading, error }
 */
export function useEpisodeData(episodeId, useSupabase = true) {
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEpisode() {
      try {
        setLoading(true);
        setError(null);

        let data;

        // Try Supabase first if enabled
        if (useSupabase) {
          const { data: supabaseData, error: supabaseError } = await getEpisode(episodeId);

          if (supabaseError) {
            console.warn('Supabase fetch failed, falling back to JSON:', supabaseError);
            // Fallback to JSON
            data = await loadFromJSON(episodeId);
          } else {
            data = transformSupabaseToEpisodeFormat(supabaseData);
          }
        } else {
          // Load from JSON directly
          data = await loadFromJSON(episodeId);
        }

        setEpisode(data);
      } catch (err) {
        console.error('Error loading episode:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (episodeId) {
      loadEpisode();
    }
  }, [episodeId, useSupabase]);

  return { episode, loading, error };
}

/**
 * Load episode from JSON file (fallback)
 */
async function loadFromJSON(episodeId) {
  const base = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${base}data/episode-${episodeId}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load episode ${episodeId}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Transform Supabase data to episode format expected by components
 */
function transformSupabaseToEpisodeFormat(supabaseData) {
  if (!supabaseData) return null;

  const episode = {
    EPISODE_NUMBER: supabaseData.EPISODE_NUMBER,
    EPISODE_TITLE: supabaseData.EPISODE_TITLE,
    AIR_DATE: supabaseData.AIR_DATE,
    HOST: supabaseData.HOST,
    QR_CODE_URL: supabaseData.QR_CODE_URL,
    QR_CODE_MESSAGE: supabaseData.QR_CODE_MESSAGE,
    HIGHLEVEL_QR_URL: supabaseData.HIGHLEVEL_QR_URL,
  };

  // Transform segments
  if (supabaseData.segments && Array.isArray(supabaseData.segments)) {
    supabaseData.segments.forEach((segment) => {
      const segNum = segment.segment_number;
      const prefix = `SEGMENT_${segNum}`;

      episode[`${prefix}_TYPE`] = segment.segment_type;

      if (segment.segment_type === 'interview' && segment.guest) {
        const guest = segment.guest;
        episode[`${prefix}_GUEST_NAME`] = guest.name;
        episode[`${prefix}_GUEST_TITLE`] = guest.title;
        episode[`${prefix}_GUEST_STYLE`] = guest.style;
        episode[`${prefix}_GUEST_LOCATION`] = guest.location;
        episode[`${prefix}_GUEST_INSTAGRAM`] = guest.instagram;
        episode[`${prefix}_PORTFOLIO_IMAGES`] = guest.portfolio_images || [];
        episode[`${prefix}_DISCUSSION_TOPICS`] = segment.discussion_topics || [];
        episode[`${prefix}_DISCUSSION_GUIDE`] = segment.discussion_guide;
      } else if (segment.segment_type === 'education') {
        episode[`${prefix}_SLIDES`] = segment.slides || [];
      }
    });
  }

  return episode;
}

/**
 * Parse episode number from URL query params
 * Usage: const episodeId = useEpisodeIdFromURL();
 */
export function useEpisodeIdFromURL() {
  const [episodeId, setEpisodeId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('episode') || params.get('id') || '1';
    setEpisodeId(id);
  }, []);

  return episodeId;
}
