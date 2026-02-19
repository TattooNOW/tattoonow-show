import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Disc3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { fetchShow } from '@/lib/api';
import type { Show, RundownEntry } from '@/lib/types';
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

export function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'rundown' | 'script' | 'social'>('rundown');

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
        {(['rundown', 'script', 'social'] as const).map(tab => (
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
