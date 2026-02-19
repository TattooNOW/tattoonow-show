import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
  currentPath: string;
  className?: string;
}

export function Sidebar({ items, currentPath, className }: SidebarProps) {
  return (
    <nav
      className={cn(
        "flex flex-col gap-1 border-r border-border bg-card p-4 min-h-screen w-60",
        className
      )}
    >
      {items.map((item) => {
        const isActive = currentPath === item.to || currentPath.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
