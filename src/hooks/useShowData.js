import { useState, useEffect } from 'react';

/**
 * Hook to load a Show JSON and all referenced Tapes.
 *
 * @param {string} showId — filename stem, e.g. "show-ep4-pricing"
 * @returns {{ show, tapes: Record<string, object>, loading, error }}
 */
export function useShowData(showId) {
  const [show, setShow] = useState(null);
  const [tapes, setTapes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showId) { setLoading(false); return; }

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const base = import.meta.env.BASE_URL || '/';

        // 1. Fetch the show JSON
        const showRes = await fetch(`${base}data/shows/${showId}.json`);
        if (!showRes.ok) throw new Error(`Show not found: ${showId}`);
        const showData = await showRes.json();

        // 2. Collect all unique tapeIds referenced in the rundown
        const tapeIds = new Set();
        for (const entry of showData.rundown || []) {
          if (entry.tapeId) tapeIds.add(entry.tapeId);
          // Also check adSlots (panel show ad breaks)
          if (entry.adSlots) {
            for (const slot of entry.adSlots) {
              if (slot.tapeId) tapeIds.add(slot.tapeId);
            }
          }
        }

        // 3. Fetch all tapes in parallel
        const tapeMap = {};
        const fetches = [...tapeIds].map(async (tapeId) => {
          // Try common naming patterns
          const paths = [
            `${base}data/tapes/${tapeId}.json`,
            `${base}data/tapes/tape-${tapeId}.json`,
          ];
          for (const path of paths) {
            try {
              const res = await fetch(path);
              if (res.ok) {
                tapeMap[tapeId] = await res.json();
                return;
              }
            } catch { /* try next */ }
          }
          console.warn(`[useShowData] Could not load tape: ${tapeId}`);
        });

        await Promise.all(fetches);

        setShow(showData);
        setTapes(tapeMap);
      } catch (err) {
        console.error('Error loading show:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [showId]);

  return { show, tapes, loading, error };
}
