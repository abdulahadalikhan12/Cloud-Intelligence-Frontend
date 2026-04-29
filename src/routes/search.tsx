import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { GlassCard, Skeleton } from "@/components/ui-bits";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "AI Search — Cloud Intelligence Platform" },
      { name: "description", content: "Semantic city search powered by AI. Find cities by climate, air quality, and lifestyle." },
    ],
  }),
  component: SearchPage,
});

const EXAMPLES = [
  "warm cities with clean air",
  "cold climate low pollution",
  "tropical megacities",
  "best air quality in Europe",
];

function SearchPage() {
  const [q, setQ] = useState("");
  const mut = useMutation({ mutationFn: (query: string) => api.semanticSearch(query, 10) });
  const results: any[] = mut.data?.results ?? mut.data?.cities ?? (Array.isArray(mut.data) ? mut.data : []);

  const submit = (text: string) => { setQ(text); mut.mutate(text); };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="text-center pt-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary-glow mb-4">
          <Sparkles className="h-3 w-3" /> AI-Powered Semantic Search
        </motion.div>
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
          Find your <span className="text-gradient">perfect city</span>
        </h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) submit(q.trim()); }} className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Find cities with clean air and warm weather..."
          className="w-full h-16 pl-14 pr-32 rounded-2xl glass-strong text-base focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        <button type="submit" disabled={!q.trim() || mut.isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 transition-colors">
          {mut.isPending ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 justify-center">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => submit(ex)}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all">
            {ex}
          </button>
        ))}
      </div>

      {mut.isPending && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => {
            const name = r.city || r.name;
            const rel = Number(r.score ?? r.relevance ?? r.similarity ?? 0);
            const relPct = rel <= 1 ? rel * 100 : rel;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{name}</h3>
                        <span className="text-xs text-muted-foreground">{r.country || ""}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.summary || r.description || r.text || ""}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 max-w-xs h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${relPct}%` }}
                            className="h-full bg-gradient-to-r from-primary to-primary-glow" />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{relPct.toFixed(0)}% match</span>
                      </div>
                    </div>
                    <Link to={"/city/$cityName" as any} params={{ cityName: name } as any}
                      className="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/15 text-primary-glow border border-primary/30 text-sm hover:bg-primary/25 transition-colors">
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
