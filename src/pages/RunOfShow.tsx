// @ts-nocheck
import React, { useState, useEffect } from 'react';

// ── Episode IDs available in /public/data/ ───────────────────────────────────
const AVAILABLE_EPISODES = [
  { id: '1',               label: 'Ep 1 – Website Fundamentals' },
  { id: '2',               label: 'Ep 2 – Pricing Psychology' },
  { id: '2-with-script',   label: 'Ep 2 – Pricing Psychology (scripted)' },
  { id: '3-with-script',   label: 'Ep 3 – (scripted)' },
];

// ── Segment-type colour coding ────────────────────────────────────────────────
const TYPE_STYLES = {
  intro:      { bg: 'bg-accent/20',   border: 'border-accent',         badge: 'bg-accent text-white' },
  discussion: { bg: 'bg-blue-900/20', border: 'border-blue-500',       badge: 'bg-blue-600 text-white' },
  education:  { bg: 'bg-purple-900/20', border: 'border-purple-500',   badge: 'bg-purple-600 text-white' },
  transition: { bg: 'bg-yellow-900/20', border: 'border-yellow-600',   badge: 'bg-yellow-600 text-black' },
  closing:    { bg: 'bg-green-900/20', border: 'border-green-600',     badge: 'bg-green-600 text-white' },
  default:    { bg: 'bg-muted/30',    border: 'border-border',         badge: 'bg-muted text-foreground' },
};

function segmentStyle(type = '') {
  return TYPE_STYLES[type.toLowerCase()] || TYPE_STYLES.default;
}

// ── Load episode JSON from /public/data/ ─────────────────────────────────────
async function fetchEpisode(id) {
  const base = import.meta.env.BASE_URL || '/';
  const res = await fetch(`${base}data/episode-${id}.json`);
  if (!res.ok) throw new Error(`Episode ${id} not found (${res.status})`);
  return res.json();
}

// ── Build a flat timeline from SHOW_SCRIPT or legacy segments ─────────────────
function buildTimeline(ep) {
  if (!ep) return [];

  // Preferred: SHOW_SCRIPT array
  if (Array.isArray(ep.SHOW_SCRIPT) && ep.SHOW_SCRIPT.length > 0) {
    return ep.SHOW_SCRIPT.map((item, i) => ({
      id: i,
      timeCode:       item.timeCode || '',
      segment:        item.segment  || '',
      title:          item.title    || '',
      type:           item.type     || 'discussion',
      talkingPoints:  item.talkingPoints || [],
      notes:          item.presenterNotes || item.notes || '',
      cue:            item.cue || '',
    }));
  }

  // Legacy: derive from top-level fields
  const rows = [];
  rows.push({
    id: 0,
    timeCode: '0:00',
    segment: 'INTRO',
    title: 'Show Open',
    type: 'intro',
    talkingPoints: [`Welcome to Episode ${ep.EPISODE_NUMBER}`, ep.EPISODE_TITLE],
    notes: '',
    cue: '',
  });

  [1, 2, 3].forEach((n, idx) => {
    const t = ep[`SEGMENT_${n}_TYPE`];
    if (!t) return;
    rows.push({
      id: rows.length,
      timeCode: '',
      segment: `SEGMENT ${n}`,
      title: t === 'interview'
        ? `Interview: ${ep[`SEGMENT_${n}_GUEST_NAME`] || ''}`
        : `Education Segment ${n}`,
      type: t === 'interview' ? 'discussion' : 'education',
      talkingPoints: ep[`SEGMENT_${n}_DISCUSSION_TOPICS`] || [],
      notes: ep[`SEGMENT_${n}_DISCUSSION_GUIDE`] || '',
      cue: '',
    });
  });

  rows.push({
    id: rows.length,
    timeCode: '',
    segment: 'CLOSING',
    title: 'Outro & CTA',
    type: 'closing',
    talkingPoints: ['Thank guest', 'Recap key takeaways', 'Drive to tattoonow.com'],
    notes: '',
    cue: '',
  });

  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EpisodeHeader({ ep }) {
  return (
    <div className="mb-8 print:mb-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground leading-tight">
        {ep.EPISODE_TITLE || 'Run of Show'}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
        {ep.EPISODE_NUMBER && (
          <span className="flex items-center gap-1">
            <span className="text-accent font-semibold">Ep {ep.EPISODE_NUMBER}</span>
          </span>
        )}
        {ep.AIR_DATE && (
          <span>{formatDate(ep.AIR_DATE)}</span>
        )}
        {ep.DURATION && (
          <span>{ep.DURATION} min</span>
        )}
        {ep.HOST && (
          <span>Host: <strong className="text-foreground">{ep.HOST}</strong></span>
        )}
      </div>

      {/* Guest card */}
      {ep.GUEST_NAME && (
        <div className="mt-4 inline-flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
            {ep.GUEST_NAME.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm">{ep.GUEST_NAME}</div>
            {ep.GUEST_TITLE && (
              <div className="text-xs text-muted-foreground">{ep.GUEST_TITLE}</div>
            )}
          </div>
          {ep.GUEST_INSTAGRAM && (
            <div className="text-xs text-accent ml-2">@{ep.GUEST_INSTAGRAM}</div>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineRow({ row, showNotes }) {
  const style = segmentStyle(row.type);
  const isAdBreak = row.type === 'transition';

  return (
    <div className={`border-l-4 rounded-r-lg ${style.border} ${style.bg} print:break-inside-avoid`}>
      <div className="p-4">
        {/* Top row: timecode + badge + title */}
        <div className="flex items-start gap-3 flex-wrap">
          {/* Timecode */}
          <div className="font-mono text-sm font-bold text-foreground w-12 shrink-0 pt-0.5">
            {row.timeCode || '—'}
          </div>

          {/* Type badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 ${style.badge}`}>
            {isAdBreak ? 'Ad Break' : row.type}
          </span>

          {/* Segment label */}
          <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">
            {row.segment}
          </span>

          {/* Title */}
          <h3 className="font-semibold text-foreground flex-1 min-w-0">
            {row.title}
          </h3>
        </div>

        {/* Talking points */}
        {row.talkingPoints.length > 0 && !isAdBreak && (
          <ul className="mt-3 ml-16 space-y-1">
            {row.talkingPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-accent mt-1 shrink-0">▸</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Cue line */}
        {row.cue && (
          <div className="mt-2 ml-16 text-xs text-yellow-400 font-mono">
            {row.cue}
          </div>
        )}

        {/* Presenter notes (collapsible) */}
        {showNotes && row.notes && (
          <div className="mt-3 ml-16 p-3 rounded bg-black/30 border border-white/10">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Presenter Notes
            </div>
            <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">
              {row.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function RunOfShow() {
  // Episode selection
  const [episodeId, setEpisodeId] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('episode') || '2-with-script';
  });

  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showNotes, setShowNotes] = useState(true);

  // Load episode
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchEpisode(episodeId)
      .then(setEpisode)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [episodeId]);

  // Update URL param without full navigation
  function handleEpisodeChange(id) {
    setEpisodeId(id);
    const url = new URL(window.location);
    url.searchParams.set('episode', id);
    window.history.replaceState({}, '', url);
  }

  const timeline = buildTimeline(episode);

  return (
    <>
      {/* ── Print styles injected inline ──────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8 print:px-0 print:py-4">

          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <div className="no-print flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Episode picker */}
              <label className="text-sm text-muted-foreground">Episode:</label>
              <select
                value={episodeId}
                onChange={e => handleEpisodeChange(e.target.value)}
                className="bg-card border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {AVAILABLE_EPISODES.map(ep => (
                  <option key={ep.id} value={ep.id}>{ep.label}</option>
                ))}
              </select>

              {/* Notes toggle */}
              <button
                onClick={() => setShowNotes(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  showNotes
                    ? 'bg-accent text-white border-accent'
                    : 'bg-transparent text-muted-foreground border-border hover:border-accent hover:text-accent'
                }`}
              >
                {showNotes ? 'Hide Notes' : 'Show Notes'}
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded text-sm font-medium border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              >
                Print / Save PDF
              </button>
              <a
                href={`${import.meta.env.BASE_URL}slideshow?mode=presenter&episode=${episodeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                Open Presenter ↗
              </a>
              <a
                href={`${import.meta.env.BASE_URL}tattoonow-show-deck.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded text-sm font-medium border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
              >
                Show Deck + Teleprompter ↗
              </a>
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-24 text-muted-foreground animate-pulse">
              Loading episode {episodeId}…
            </div>
          )}

          {error && (
            <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-destructive">
              <strong>Error:</strong> {error}
            </div>
          )}

          {episode && !loading && (
            <>
              <EpisodeHeader ep={episode} />

              {/* Legend */}
              <div className="no-print flex flex-wrap gap-2 mb-6">
                {Object.entries(TYPE_STYLES).filter(([k]) => k !== 'default').map(([type, s]) => (
                  <span key={type} className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${s.badge}`}>
                    {type === 'transition' ? 'Ad Break' : type}
                  </span>
                ))}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {timeline.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    No timeline data found for this episode.
                  </div>
                )}
                {timeline.map(row => (
                  <TimelineRow key={row.id} row={row} showNotes={showNotes} />
                ))}
              </div>

              {/* Footer meta */}
              <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex flex-wrap gap-4">
                {episode.QR_CODE_URL && (
                  <span>QR: {episode.QR_CODE_URL}</span>
                )}
                {episode.QR_CODE_MESSAGE && (
                  <span>CTA: {episode.QR_CODE_MESSAGE}</span>
                )}
                <span className="ml-auto">Show Control</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
