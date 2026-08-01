export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="flex items-center justify-between">
            <SkeletonLine width="40%" height={12} />
            <SkeletonLine width={32} height={32} className="!rounded-lg" />
          </div>
          <SkeletonLine width="60%" height={28} />
          <SkeletonLine width="30%" height={10} />
          <SkeletonLine width="100%" height={4} className="!rounded-full" />
        </div>
      ))}
    </>
  );
}

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLine width={140} height={14} />
          <SkeletonLine width={100} height={10} />
        </div>
        <SkeletonLine width={60} height={22} className="!rounded-full" />
      </div>
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 skeleton !rounded-t-md"
            // eslint-disable-next-line react-hooks/purity
            style={{ height: `${30 + Math.random() * 60}%`, animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="card p-5 space-y-3 animate-fade-in">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={`${80 / cols}%`} height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4" style={{ animationDelay: `${i * 0.04}s` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} width={`${80 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLine width={240} height={22} />
          <SkeletonLine width={180} height={12} />
        </div>
        <SkeletonLine width={100} height={28} className="!rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <SkeletonCard count={6} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonChart key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SkeletonTable rows={4} cols={4} /></div>
        <SkeletonCard count={1} />
      </div>
    </div>
  );
}
