import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Disc3, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchTape } from '@/lib/api';
import { tapeContentToMarkdown, markdownToTapeContent } from '@/lib/markdown';
import type { Tape } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  opportunity: 'bg-yellow-500/20 text-yellow-400',
  collecting: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  complete: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/20 text-gray-400',
};

function getTapeName(tape: Tape): string {
  if ('subject' in tape && tape.subject) return tape.subject.name;
  if ('panelists' in tape && tape.panelists) return tape.panelists.map(p => p.name).join(', ');
  if ('sponsor' in tape && tape.sponsor) return tape.sponsor.name;
  return tape.id;
}

export function TapeDetail() {
  const { id } = useParams<{ id: string }>();
  const [tape, setTape] = useState<Tape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'markdown' | 'media'>('details');
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchTape(id)
      .then(t => {
        setTape(t);
        setMarkdown(tapeContentToMarkdown(t));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading tape...</div>;
  if (error || !tape) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error || 'Tape not found'}</p>
        <Link to="/admin/tapes" className="text-sm text-accent hover:underline mt-2 inline-block">
          &larr; Back to tapes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/tapes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{getTapeName(tape)}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[tape.status] || '')}>
              {tape.status}
            </span>
            <span className="text-sm text-muted-foreground">{tape.type}</span>
            <span className="text-sm text-muted-foreground">&middot; {tape.estimatedDuration}m</span>
            <span className="text-sm text-muted-foreground">&middot; {tape.createdDate}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {(['details', 'markdown', 'media'] as const).map(tab => (
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

      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {/* Subject info */}
          {'subject' in tape && tape.subject && (
            <Card>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Subject</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {tape.subject.name}</div>
                <div><span className="text-muted-foreground">Title:</span> {tape.subject.title}</div>
                <div><span className="text-muted-foreground">Style:</span> {tape.subject.style}</div>
                <div><span className="text-muted-foreground">Location:</span> {tape.subject.location}</div>
                <div><span className="text-muted-foreground">Instagram:</span> @{tape.subject.instagram}</div>
                {tape.subject.website && (
                  <div>
                    <span className="text-muted-foreground">Website:</span>{' '}
                    <a href={tape.subject.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {tape.subject.website} <ExternalLink size={12} className="inline" />
                    </a>
                  </div>
                )}
              </div>
              {tape.subject.bio && (
                <p className="mt-3 text-sm text-muted-foreground">{tape.subject.bio}</p>
              )}
            </Card>
          )}

          {/* Panelists */}
          {'panelists' in tape && tape.panelists && (
            <Card>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Panelists ({tape.panelists.length})
              </h3>
              <div className="space-y-3">
                {tape.panelists.map((p, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">@{p.instagram} &middot; {p.location}</div>
                      {p.perspective && (
                        <div className="text-sm mt-2 italic text-muted-foreground">"{p.perspective}"</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sponsor */}
          {'sponsor' in tape && tape.sponsor && (
            <Card>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sponsor</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {tape.sponsor.name}</div>
                {tape.sponsor.type && <div><span className="text-muted-foreground">Type:</span> {tape.sponsor.type}</div>}
                {tape.sponsor.eventDates && <div><span className="text-muted-foreground">Dates:</span> {tape.sponsor.eventDates}</div>}
                {tape.sponsor.eventLocation && <div><span className="text-muted-foreground">Location:</span> {tape.sponsor.eventLocation}</div>}
              </div>
              {tape.sponsor.adCopy && (
                <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Ad Copy:</span>
                  <p className="mt-1">{tape.sponsor.adCopy}</p>
                </div>
              )}
            </Card>
          )}

          {/* Tags */}
          <Card>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tape.tags.map(tag => (
                <span key={tag} className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'markdown' && (
        <div className="grid grid-cols-2 gap-4" style={{ minHeight: '500px' }}>
          {/* Editor */}
          <div className="flex flex-col">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Markdown (editable)
            </div>
            <textarea
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              className="flex-1 p-4 rounded-lg bg-muted border border-border text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-accent"
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          <div className="flex flex-col">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Preview
            </div>
            <div className="flex-1 p-4 rounded-lg bg-card border border-border text-sm overflow-y-auto">
              <MarkdownPreview markdown={markdown} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div>
          {tape.media && tape.media.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {tape.media.images.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={img.url}
                    alt={img.description}
                    className="w-full aspect-[4/5] object-cover"
                    loading="lazy"
                  />
                  <div className="p-2 text-xs text-muted-foreground">{img.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No media attached to this tape.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Simple markdown preview (controlled subset) */
function MarkdownPreview({ markdown }: { markdown: string }) {
  const html = useMemo(() => {
    return markdown
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<br/>';
        if (trimmed.startsWith('## ')) return `<h3 class="text-base font-semibold text-accent mt-4 mb-1">${trimmed.slice(3)}</h3>`;
        if (trimmed.startsWith('# ')) return `<h2 class="text-lg font-bold text-accent mt-4 mb-2">${trimmed.slice(2)}</h2>`;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return `<div class="flex gap-2 ml-2"><span class="text-accent mt-1.5 text-xs">&#9679;</span><span>${trimmed.slice(2)}</span></div>`;
        if (trimmed.startsWith('> ')) return `<div class="pl-3 border-l-2 border-accent/30 text-muted-foreground italic">${trimmed.slice(2)}</div>`;
        if (/^\*[^*]+\*$/.test(trimmed)) return `<em class="text-muted-foreground">${trimmed.slice(1, -1)}</em>`;
        if (trimmed.startsWith('**') && trimmed.includes(':**')) {
          const [label, ...rest] = trimmed.split(':**');
          return `<div><strong class="text-accent">${label.replace(/^\*\*/, '')}:</strong> ${rest.join(':**').replace(/\*\*$/, '')}</div>`;
        }
        if (trimmed.startsWith('CUE:')) return `<div class="text-yellow-400 font-mono text-xs mt-2">${trimmed}</div>`;
        if (trimmed.startsWith('Stats:')) return `<div class="text-muted-foreground font-mono text-xs">${trimmed}</div>`;
        if (trimmed.startsWith('Layout:')) return `<div class="text-muted-foreground font-mono text-xs">${trimmed}</div>`;
        if (trimmed.startsWith('Images:')) return `<div class="text-muted-foreground font-mono text-xs">${trimmed}</div>`;
        return `<p>${trimmed}</p>`;
      })
      .join('');
  }, [markdown]);

  return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1 leading-relaxed" />;
}
