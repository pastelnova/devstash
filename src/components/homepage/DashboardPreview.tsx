const CARDS = [
  { color: "#3b82f6", lines: [70, 50, 40] },
  { color: "#f59e0b", lines: [60, 80, 35] },
  { color: "#06b6d4", lines: [80, 45, 60] },
  { color: "#22c55e", lines: [55, 70, 40] },
  { color: "#ec4899", lines: [65, 50, 75] },
  { color: "#6366f1", lines: [70, 40, 55] },
];

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#12121a]">
      {/* Window dots */}
      <div className="flex gap-1.5 border-b border-white/10 px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
      </div>

      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="h-1.5 w-2/5 rounded-sm bg-white/10" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-7 rounded-sm bg-white/10" />
          <div className="h-1.5 w-9 rounded-sm bg-blue-500/50" />
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-2.5 p-3" style={{ minHeight: 200 }}>
        {/* Sidebar */}
        <div className="flex w-12 flex-col gap-2">
          <div className="h-2 rounded bg-blue-500/60" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
        </div>

        {/* Content grid */}
        <div className="grid flex-1 grid-cols-2 gap-2">
          {CARDS.map((card) => (
            <div
              key={card.color}
              className="flex flex-col gap-1.5 rounded-md bg-[#16161f] p-2.5"
              style={{ borderTop: `3px solid ${card.color}`, minHeight: 60 }}
            >
              {card.lines.map((w, j) => (
                <div
                  key={j}
                  className="h-1 rounded-sm bg-white/8"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
