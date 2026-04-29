import { useEffect, useRef, useState } from "react";
import { Search, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { searchCitiesQuery } from "@/lib/queries";

function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function useUtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now.toUTCString().split(" ").slice(4, 5)[0] + " UTC";
}

export function TopBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 300);
  const { data, isLoading } = useQuery(searchCitiesQuery(debounced));
  const navigate = useNavigate();
  const time = useUtcClock();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 px-4 lg:px-8 flex items-center gap-4 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div ref={ref} className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search cities..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
        />
        {open && debounced && (
          <div className="absolute top-12 inset-x-0 glass-strong rounded-xl overflow-hidden max-h-80 overflow-y-auto scrollbar-thin animate-fade-in">
            {isLoading && <div className="p-4 text-sm text-muted-foreground">Searching...</div>}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No cities found</div>
            )}
            {data?.slice(0, 8).map((c) => (
              <button
                key={`${c.name}-${c.lat}`}
                onClick={() => {
                  navigate({ to: "/city/$cityName", params: { cityName: c.name } });
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-primary/10 text-sm flex justify-between items-center transition-colors"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
        <Clock className="h-3.5 w-3.5" />
        <span>{new Date().toUTCString().slice(17, 25)} UTC</span>
        <span className="sr-only">{time}</span>
      </div>
    </header>
  );
}
