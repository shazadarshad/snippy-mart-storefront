/** Lightweight route-chunk fallback — no full-screen blur (felt like freezing). */
const GlobalLoader = () => {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center py-16"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: '0.65s' }}
        />
        <p className="text-xs font-medium text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
};

export default GlobalLoader;
