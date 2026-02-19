import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { listTapes } from '@/lib/api';
import type { Tape, TapeType, TapeStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<TapeStatus, string> = {
  opportunity: 'bg-yellow-500/20 text-yellow-400',
  collecting: 'bg-blue-500/20 text-blue-400',
  review: 'bg-purple-500/20 text-purple-400',
  complete: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/20 text-gray-400',
};

const TYPE_COLORS: Record<string, string> = {
  interview: 'bg-orange-500/20 text-orange-400',
  'text-qa': 'bg-teal-500/20 text-teal-400',
  panel: 'bg-indigo-500/20 text-indigo-400',
  variety: 'bg-pink-500/20 text-pink-400',
  education: 'bg-emerald-500/20 text-emerald-400',
  clips: 'bg-cyan-500/20 text-cyan-400',
  promo: 'bg-amber-500/20 text-amber-400',
  sponsor: 'bg-lime-500/20 text-lime-400',
  ad: 'bg-slate-500/20 text-slate-400',
};

function getTapeName(tape: Tape): string {
  if ('subject' in tape && tape.subject) return tape.subject.name;
  if ('panelists' in tape && tape.panelists) return tape.panelists.map(p => p.name).join(', ');
  if ('sponsor' in tape && tape.sponsor) return tape.sponsor.name;
  if (tape.type === 'variety' && 'variant' in tape) return (tape as any).variant;
  return tape.id;
}

type SortKey = 'name' | 'type' | 'status' | 'date';

export function TapeList() {
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TapeType | ''>('');
  const [filterStatus, setFilterStatus] = useState<TapeStatus | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    listTapes().then(t => { setTapes(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  let filtered = tapes.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        getTapeName(t).toLowerCase().includes(s) ||
        t.id.toLowerCase().includes(s) ||
        t.tags.some(tag => tag.toLowerCase().includes(s))
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = getTapeName(a).localeCompare(getTapeName(b)); break;
      case 'type': cmp = a.type.localeCompare(b.type); break;
      case 'status': cmp = a.status.localeCompare(b.status); break;
      case 'date': cmp = a.createdDate.localeCompare(b.createdDate); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading tapes...</div>;
  }

  const types = [...new Set(tapes.map(t => t.type))].sort();
  const statuses = [...new Set(tapes.map(t => t.status))].sort();

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tapes</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} of {tapes.length}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tapes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as TapeType | '')}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as TapeStatus | '')}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {([
                ['name', 'Name'],
                ['type', 'Type'],
                ['status', 'Status'],
                ['date', 'Created'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="text-left px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort(key)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <ArrowUpDown size={12} className={sortKey === key ? 'text-accent' : 'opacity-30'} />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-3 font-medium">Tags</th>
              <th className="text-right px-4 py-3 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tape => (
              <tr
                key={tape.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/tapes/${tape.id}`}
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {getTapeName(tape)}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">{tape.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', TYPE_COLORS[tape.type] || '')}>
                    {tape.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[tape.status] || '')}>
                    {tape.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {tape.createdDate}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tape.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {tape.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{tape.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {tape.estimatedDuration}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No tapes match your filters.
          </div>
        )}
      </Card>
    </div>
  );
}
