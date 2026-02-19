import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Disc3, Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { listShows, listTapes, fetchTalentPool } from '@/lib/api';
import type { Show, Tape, TalentMember } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  opportunity: 'bg-yellow-500/20 text-yellow-400',
  collecting: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  complete: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/20 text-gray-400',
};

export function AdminDashboard() {
  const [shows, setShows] = useState<Show[]>([]);
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [talent, setTalent] = useState<TalentMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, t, tp] = await Promise.all([
          listShows(),
          listTapes(),
          fetchTalentPool(),
        ]);
        setShows(s);
        setTapes(t);
        setTalent(tp.talent);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Tape status counts
  const statusCounts = tapes.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  // Tape type counts
  const typeCounts = tapes.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10">
            <Film size={24} className="text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold">{shows.length}</div>
            <div className="text-sm text-muted-foreground">Shows</div>
          </div>
          <Link to="/admin/shows" className="ml-auto text-accent hover:text-accent/80">
            <ArrowRight size={18} />
          </Link>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10">
            <Disc3 size={24} className="text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold">{tapes.length}</div>
            <div className="text-sm text-muted-foreground">Tapes</div>
          </div>
          <Link to="/admin/tapes" className="ml-auto text-accent hover:text-accent/80">
            <ArrowRight size={18} />
          </Link>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10">
            <Users size={24} className="text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold">{talent.length}</div>
            <div className="text-sm text-muted-foreground">Talent</div>
          </div>
          <Link to="/admin/talent" className="ml-auto text-accent hover:text-accent/80">
            <ArrowRight size={18} />
          </Link>
        </Card>
      </div>

      {/* Tape Pipeline */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Tape Pipeline</h2>
        <div className="flex gap-3 mb-4">
          {['opportunity', 'collecting', 'review', 'complete', 'archived'].map(status => (
            <div key={status} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] || ''}`}>
                {status}
              </span>
              <span className="text-sm text-muted-foreground">{statusCounts[status] || 0}</span>
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          By type: {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="mr-3">
              <span className="text-foreground font-medium">{count}</span> {type}
            </span>
          ))}
        </div>
      </Card>

      {/* Recent Shows */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Shows</h2>
          <Link to="/admin/shows" className="text-sm text-accent hover:underline">
            View all &rarr;
          </Link>
        </div>
        {shows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No shows assembled yet.</p>
        ) : (
          <div className="space-y-2">
            {shows.map(show => (
              <Link
                key={show.id}
                to={`/admin/shows/${show.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="font-medium">
                    Ep {show.episode.number}: {show.episode.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {show.episode.airDate} &middot; {show.rundown.length} segments
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
