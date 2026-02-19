export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Show Control &mdash; Slideshow Admin</span>
          <span>&copy; {new Date().getFullYear()} TattooNOW</span>
        </div>
      </div>
    </footer>
  );
}
