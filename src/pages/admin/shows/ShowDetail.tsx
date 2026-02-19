import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Disc3, Image, FileText, Presentation, GraduationCap, Clapperboard, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { fetchShow, fetchTape } from '@/lib/api';
import { buildSlidesFromShow } from '@/lib/buildSlidesFromShow';
import type { Show, RundownEntry, Tape } from '@/lib/types';
import { cn } from '@/lib/utils';

const SEGMENT_COLORS: Record<string, string> = {
  'title-card': 'border-l-accent',
  'intro': 'border-l-green-500',
  'guest-intro': 'border-l-orange-400',
  'portfolio': 'border-l-blue-400',
  'discussion': 'border-l-purple-400',
  'education': 'border-l-emerald-400',
  'text-qa': 'border-l-teal-400',
  'clips': 'border-l-cyan-400',
  'ad-break': 'border-l-yellow-500',
  'variety': 'border-l-pink-400',
  'outro': 'border-l-green-500',
  'panel': 'border-l-indigo-400',
  'panel-intro': 'border-l-indigo-300',
};

const SLIDE_TYPE_ICONS: Record<string, typeof Image> = {
  title: Presentation,
  portfolio: Image,
  education: GraduationCap,
  script: FileText,
};

const SLIDE_TYPE_COLORS: Record<string, string> = {
  title: 'bg-accent/20 text-accent border-accent/30',
  portfolio: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  education: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  script: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'rundown' | 'slides' | 'script' | 'social'>('rundown');

  useEffect(() => {
    if (!id) return;
    fetchShow(id)
      .then(s => setShow(s))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading show...</div>;
  if (error || !show) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error || 'Show not found'}</p>
        <Link to="/admin/shows" className="text-sm text-accent hover:underline mt-2 inline-block">
          &larr; Back to shows
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/shows" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Ep {show.episode.number}: {show.episode.title}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{show.episode.host}</span>
            <span>&middot;</span>
            <span>{show.episode.airDate}</span>
            <span>&middot;</span>
            <span>{show.episode.duration}min</span>
            <span>&middot;</span>
            <span>{show.rundown.length} segments</span>
          </div>
        </div>
        <a
          href={`${import.meta.env.BASE_URL}slideshow?mode=presenter&show=${show.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          <ExternalLink size={14} />
          Preview
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {(['rundown', 'slides', 'script', 'social'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Rundown */}
      {activeTab === 'rundown' && (
        <div className="space-y-1">
          {show.rundown.map((entry, i) => (
            <RundownRow key={i} entry={entry} />
          ))}
        </div>
      )}

      {/* Slides (built from show + tapes) */}
      {activeTab === 'slides' && <SlidesPreview show={show} />}

      {/* Script (markdown from talking points) */}
      {activeTab === 'script' && (
        <Card>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Show Script (generated from rundown)
          </h3>
          <div className="space-y-4">
            {show.rundown.filter(r => r.talkingPoints || r.presenterNotes).map((entry, i) => (
              <div key={i} className="border-l-2 border-accent/30 pl-4">
                <div className="text-sm font-semibold text-accent">{entry.label || entry.type}</div>
                <div className="text-xs text-muted-foreground mb-2">{entry.timeCode} &middot; {entry.duration}</div>
                {entry.talkingPoints && (
                  <ul className="space-y-1 mb-2">
                    {entry.talkingPoints.map((tp, j) => (
                      <li key={j} className="text-sm flex gap-2">
                        <span className="text-accent mt-1 text-xs">&#9679;</span>
                        {tp}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.presenterNotes && (
                  <p className="text-sm text-muted-foreground italic">{entry.presenterNotes}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Social */}
      {activeTab === 'social' && show.social && (
        <div className="space-y-4">
          {show.social.youtube && (
            <Card>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">YouTube</h3>
              <div className="font-medium mb-2">{show.social.youtube.title}</div>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{show.social.youtube.description}</pre>
            </Card>
          )}
          {show.social.instagram && (
            <Card>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Instagram</h3>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{show.social.instagram.caption}</pre>
              <div className="text-xs text-muted-foreground mt-2">{show.social.instagram.hashtags}</div>
            </Card>
          )}
          {show.social.linkedin && (
            <Card>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">LinkedIn</h3>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{show.social.linkedin.post}</pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── Slides Preview ─────────────────────────────────────────────────────

function SlidesPreview({ show }: { show: Show }) {
  const [slides, setSlides] = useState<any[]>([]);
  const [tapes, setTapes] = useState<Record<string, Tape>>({});
  const [loading, setLoading] = useState(true);
  const [tapesLoaded, setTapesLoaded] = useState(0);
  const [tapesTotal, setTapesTotal] = useState(0);
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);

  // Collect unique tapeIds and fetch them
  useEffect(() => {
    const tapeIds = new Set<string>();
    for (const entry of show.rundown) {
      if (entry.tapeId) tapeIds.add(entry.tapeId);
    }

    const ids = [...tapeIds];
    setTapesTotal(ids.length);

    if (ids.length === 0) {
      const built = buildSlidesFromShow(show, {});
      setSlides(built);
      setLoading(false);
      return;
    }

    let loaded = 0;
    const tapeMap: Record<string, Tape> = {};

    Promise.allSettled(
      ids.map(async (tapeId) => {
        try {
          const tape = await fetchTape(tapeId);
          tapeMap[tapeId] = tape;
        } catch {
          console.warn(`[SlidesPreview] Could not load tape: ${tapeId}`);
        }
        loaded++;
        setTapesLoaded(loaded);
      })
    ).then(() => {
      setTapes(tapeMap);
      const built = buildSlidesFromShow(show, tapeMap);
      setSlides(built);
      setLoading(false);
    });
  }, [show]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground animate-pulse mb-2">
          Loading tapes... {tapesLoaded}/{tapesTotal}
        </div>
        <div className="w-48 mx-auto h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: tapesTotal > 0 ? `${(tapesLoaded / tapesTotal) * 100}%` : '0%' }}
          />
        </div>
      </div>
    );
  }

  const typeCounts = slides.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  const tapeCount = Object.keys(tapes).length;
  const missingTapes = tapesTotal - tapeCount;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
        <div className="text-sm">
          <span className="font-semibold text-foreground">{slides.length}</span>
          <span className="text-muted-foreground"> slides</span>
        </div>
        <div className="text-sm text-muted-foreground">from</div>
        <div className="text-sm">
          <span className="font-semibold text-foreground">{tapeCount}</span>
          <span className="text-muted-foreground"> tapes</span>
        </div>
        {missingTapes > 0 && (
          <div className="text-sm text-yellow-500">
            ({missingTapes} tape{missingTapes > 1 ? 's' : ''} not found)
          </div>
        )}
        <div className="ml-auto flex gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span
              key={type}
              className={cn(
                'text-xs px-2 py-0.5 rounded border',
                SLIDE_TYPE_COLORS[type] || 'bg-muted text-muted-foreground border-border'
              )}
            >
              {type} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* Slide list */}
      <div className="space-y-1">
        {slides.map((slide, i) => (
          <SlideRow
            key={i}
            index={i}
            slide={slide}
            expanded={expandedSlide === i}
            onToggle={() => setExpandedSlide(expandedSlide === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}

function SlideRow({ index, slide, expanded, onToggle }: {
  index: number;
  slide: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = SLIDE_TYPE_ICONS[slide.type] || Clapperboard;
  const colorClass = SLIDE_TYPE_COLORS[slide.type] || 'bg-muted text-muted-foreground border-border';

  // Derive a short label for the slide
  const label = slide.title
    || slide.artistName
    || slide.segment
    || slide.type;

  const imageCount = slide.images?.length || 0;
  const pointCount = slide.talkingPoints?.length || 0;
  const hasRange = slide.range && Array.isArray(slide.range);
  const hasNotes = !!(slide.presenterNotes || slide.notes);

  return (
    <div className="rounded-lg bg-card/50 overflow-hidden">
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="text-xs font-mono text-muted-foreground w-8 text-right">
          {index + 1}
        </div>
        <div className={cn('p-1.5 rounded border', colorClass)}>
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{label}</div>
          <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
            {slide.timeCode && <span className="font-mono">{slide.timeCode}</span>}
            {slide.scriptType && <span>{slide.scriptType}</span>}
            {imageCount > 0 && (
              <span className="flex items-center gap-1">
                <Image size={10} />
                {hasRange ? `${slide.range[0]}–${slide.range[1]}` : imageCount}
                {imageCount > 0 && !hasRange ? ' images' : ''}
              </span>
            )}
            {pointCount > 0 && <span>{pointCount} points</span>}
            {slide.showLowerThird && <span className="text-orange-400">lower-third</span>}
            {slide.showQR && <span className="text-yellow-400">QR</span>}
          </div>
        </div>
        <div className={cn('text-xs px-2 py-0.5 rounded border', colorClass)}>
          {slide.type}
        </div>
        {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pl-16 space-y-3">
          {/* Images preview row */}
          {imageCount > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Images ({imageCount} total{hasRange ? `, showing ${slide.range[0]}–${slide.range[1]}` : ''})
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(hasRange
                  ? slide.images.slice(slide.range[0], slide.range[1] + 1)
                  : slide.images.slice(0, 8)
                ).map((img: any, j: number) => (
                  <div key={j} className="flex-shrink-0 w-20 h-20 rounded overflow-hidden bg-muted border border-border">
                    <img
                      src={img.url || img}
                      alt={img.description || `Image ${j + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
                {!hasRange && imageCount > 8 && (
                  <div className="flex-shrink-0 w-20 h-20 rounded bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">
                    +{imageCount - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Talking points */}
          {pointCount > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Talking Points
              </div>
              <ul className="space-y-1">
                {slide.talkingPoints.map((tp: string, j: number) => (
                  <li key={j} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-accent text-xs mt-1">&#9679;</span>
                    <span className="line-clamp-2">{tp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Education fields */}
          {slide.type === 'education' && slide.keyPoints?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Key Points
              </div>
              <ul className="space-y-1">
                {slide.keyPoints.map((kp: string, j: number) => (
                  <li key={j} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-emerald-400 text-xs mt-1">&#9679;</span>
                    {kp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {slide.type === 'education' && slide.stats?.length > 0 && (
            <div className="flex gap-3">
              {slide.stats.map((stat: any, j: number) => (
                <div key={j} className="bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
                  <div className="text-lg font-bold text-emerald-400">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Guest / artist info */}
          {slide.artistName && slide.type === 'portfolio' && (
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">{slide.artistName}</span>
              {slide.artistStyle && <span className="text-muted-foreground">{slide.artistStyle}</span>}
              {slide.artistLocation && <span className="text-muted-foreground">{slide.artistLocation}</span>}
              {slide.artistInstagram && <span className="text-accent">@{slide.artistInstagram}</span>}
            </div>
          )}

          {/* Presenter notes */}
          {hasNotes && (
            <div className="bg-muted/30 rounded px-3 py-2 border-l-2 border-accent/30">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Presenter Notes
              </div>
              <p className="text-sm text-muted-foreground italic line-clamp-3">
                {slide.presenterNotes || slide.notes}
              </p>
            </div>
          )}

          {/* Cue */}
          {slide.cue && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2 text-sm font-semibold text-yellow-400">
              CUE: {slide.cue}
            </div>
          )}

          {/* Lower-third info */}
          {slide.showLowerThird && slide.guestName && (
            <div className="text-xs text-muted-foreground">
              Lower-third: {slide.guestName}{slide.guestTitle ? ` — ${slide.guestTitle}` : ''}{slide.guestInstagram ? ` (@${slide.guestInstagram})` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rundown Row (existing) ─────────────────────────────────────────────

function RundownRow({ entry }: { entry: RundownEntry }) {
  const colorClass = SEGMENT_COLORS[entry.type] || 'border-l-gray-500';

  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 rounded-lg border-l-4 bg-card/50 hover:bg-muted/30 transition-colors',
      colorClass
    )}>
      <div className="w-16 text-xs font-mono text-muted-foreground">
        {entry.timeCode}
      </div>
      <div className="w-14 text-xs font-mono text-muted-foreground">
        {entry.duration}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">
          {entry.label || entry.type}
        </div>
        {entry.tapeId && (
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Disc3 size={10} />
            {entry.tapeId}
            {entry.tapeType && <span className="text-accent/60">({entry.tapeType})</span>}
          </div>
        )}
      </div>
      <div className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
        {entry.type}
      </div>
    </div>
  );
}
