import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { fetchTalentPool } from '@/lib/api';
import type { TalentMember, TalentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<TalentStatus, string> = {
  available: 'bg-green-500/20 text-green-400',
  contacted: 'bg-blue-500/20 text-blue-400',
  confirmed: 'bg-accent/20 text-accent',
  declined: 'bg-red-500/20 text-red-400',
  appeared: 'bg-purple-500/20 text-purple-400',
  recurring: 'bg-teal-500/20 text-teal-400',
};

export function TalentList() {
  const [talent, setTalent] = useState<TalentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TalentStatus | ''>('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    fetchTalentPool()
      .then(tp => { setTalent(tp.talent); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  let filtered = talent.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterRole && !t.roles.includes(filterRole as any)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(s) ||
        t.style.toLowerCase().includes(s) ||
        t.location.toLowerCase().includes(s) ||
        t.tags.some(tag => tag.toLowerCase().includes(s))
      );
    }
    return true;
  });

  if (loading) return <div className="p-8 text-muted-foreground">Loading talent pool...</div>;

  const statuses = [...new Set(talent.map(t => t.status))].sort();
  const roles = [...new Set(talent.flatMap(t => t.roles))].sort();

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Talent Pool</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} of {talent.length}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search talent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as TalentStatus | '')}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
        >
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(person => (
          <Card key={person.id} className="hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-lg">{person.name}</div>
                <div className="text-sm text-muted-foreground">{person.style}</div>
              </div>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[person.status] || '')}>
                {person.status}
              </span>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {person.location} &middot; @{person.instagram}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {person.roles.map(role => (
                <span key={role} className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-xs font-medium">
                  {role}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {person.tags.slice(0, 5).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
              {person.tags.length > 5 && (
                <span className="text-xs text-muted-foreground">+{person.tags.length - 5}</span>
              )}
            </div>

            {person.notes && (
              <p className="text-xs text-muted-foreground">{person.notes}</p>
            )}

            {person.appearances.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {person.appearances.length} appearance{person.appearances.length > 1 ? 's' : ''}
                {' '}&middot; Last: Ep {person.appearances[person.appearances.length - 1].episode}
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <div className="text-center py-8 text-muted-foreground">
            No talent matches your filters.
          </div>
        </Card>
      )}
    </div>
  );
}
