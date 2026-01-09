export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>© 2024 Power Monitor Dashboard</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Real-time monitoring system</span>
        </div>
      </div>
    </footer>
  );
}