import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Disc3,
  Users,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/shows', label: 'Shows', icon: Film },
  { to: '/admin/tapes', label: 'Tapes', icon: Disc3 },
  { to: '/admin/talent', label: 'Talent', icon: Users },
  { to: '/admin/seasons', label: 'Seasons', icon: Calendar },
];

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <nav className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-sm font-bold tracking-wider uppercase text-accent">
            TattooNOW Admin
          </h1>
        </div>
        <div className="flex-1 py-2 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/10 text-accent border-r-2 border-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <NavLink
            to="/run-of-show"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Run of Show
          </NavLink>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
