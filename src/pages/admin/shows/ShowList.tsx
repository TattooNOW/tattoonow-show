import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { listShows } from '@/lib/api';
import type { Show } from '@/lib/types';

export function ShowList() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShows().then(s => { setShows(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading shows...</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shows</h1>
        <span className="text-sm text-muted-foreground">{shows.length} shows</span>
      </div>

      {shows.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Film size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No shows assembled yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Shows are assembled from a format template + tapes.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {shows.map(show => (
            <Link key={show.id} to={`/admin/shows/${show.id}`}>
              <Card className="hover:border-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">
                      Ep {show.episode.number}: {show.episode.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {show.episode.host} &middot; {show.episode.airDate} &middot; {show.episode.duration}min
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {show.rundown.length} rundown segments
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {show.rundown.filter(r => r.tapeId).length} tapes slotted
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
