import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Show Control &mdash; Slideshow Admin</span>
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-1 opacity-40 hover:opacity-100 hover:text-accent transition-all"
              title="Admin"
            >
              <Settings size={12} />
              <span>Admin</span>
            </Link>
            <span>&copy; {new Date().getFullYear()} TattooNOW</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
