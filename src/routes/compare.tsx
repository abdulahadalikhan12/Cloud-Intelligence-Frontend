import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Plus, Trophy } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { citiesQuery } from "@/lib/queries";
import { api, pickAqi } from "@/lib/api";
import { GlassCard, SectionTitle, Skeleton } from "@/components/ui-bits";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Cities — Cloud Intelligence Platform" },
      { name: "description", content: "Compare up to 5 cities side-by-side across weather and air quality metrics." },
    ],
  }),
  component: Compare,
});

function Compare() {
  const { data: cities } = useQuery(citiesQuery);
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const compareMut = useMutation({ mutationFn: (names: string[]) => api.compare(names) });

  const add = (name: string) => {
    if (selected.includes(name) || selected.length >= 5) return;
    setSelected([...selected, name]);
    setPickerOpen(false); setFilter("");
  };
  const remove = (name: string) => setSelected(selected.filter((n) => n !== name));

  const filtered = cities?.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase())).slice(0, 30) ?? [];

  const result = compareMut.data;
  const items: any[] = result?.cities ?? result?.results ?? result?.comparison ?? (Array.isArray(result) ? result : []);
  const best = result?.best || result?.winner || items[0]?.name;

  const radarData = ["AQI", "Temp", "Humidity", "PM2.5", "Score"].map((metric) => {
    const row: any = { metric };
    items.forEach((c, idx) => {
      const name = c.city || c.name;
      const v = metric === "AQI" ? 100 - Math.min(100, pickAqi(c.air_quality ?? c) / 3)
        : metric === "Temp" ? Number(c.weather?.temperature ?? c.temperature ?? 50)
        : metric === "Humidity" ? Number(c.weather?.humidity ?? c.humidity ?? 50)
        : metric === "PM2.5" ? Math.max(0, 100 - Number(c.air_quality?.pm25 ?? c.pm25 ?? 0))
        : Number(c.score ?? c.livability_score ?? 50);
      row[name || `c${idx}`] = Math.max(0, Math.min(100, v));
    });
    return row;
  });

  const colors = ["#818cf8", "#10b981", "#f59e0b", "#ef4444", "#a855f7"];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Compare Cities</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick up to 5 cities to compare side-by-side.</p>
      </div>

      <GlassCard hover={false}>
        <div className="flex flex-wrap gap-2 items-center">
          {selected.map((name) => (
            <motion.span key={name} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-sm">
              {name}
              <button onClick={() => remove(name)} className="hover:text-danger"><X className="h-3 w-3" /></button>
            </motion.span>
          ))}
          {selected.length < 5 && (
            <div className="relative">
              <button onClick={() => setPickerOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add City
              </button>
              {pickerOpen && (
                <div className="absolute top-10 left-0 z-20 w-72 glass-strong rounded-xl p-2 max-h-80 overflow-y-auto scrollbar-thin">
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} autoFocus placeholder="Type to filter..."
                    className="w-full px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none" />
                  {filtered.map((c) => (
                    <button key={c.name} onClick={() => add(c.name)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-sm flex justify-between">
                      <span>{c.name}</span><span className="text-xs text-muted-foreground">{c.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            disabled={selected.length < 2 || compareMut.isPending}
            onClick={() => compareMut.mutate(selected)}
            className="ml-auto px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {compareMut.isPending ? "Analyzing…" : "Compare"}
          </button>
        </div>
      </GlassCard>

      {compareMut.isPending && <Skeleton className="h-96" />}

      {items.length > 0 && (
        <>
          <GlassCard>
            <SectionTitle>Results</SectionTitle>
            {best && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-success/15 border border-success/30 text-sm">
                <Trophy className="h-4 w-4 text-success" /> Best Overall: <span className="font-bold">{best}</span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-white/5">
                    <th className="py-2 px-3">Metric</th>
                    {items.map((c) => <th key={c.name || c.city} className="py-2 px-3">{c.name || c.city}</th>)}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[
                    ["AQI", (c: any) => Math.round(pickAqi(c.air_quality ?? c))],
                    ["Temperature", (c: any) => `${Math.round(Number(c.weather?.temperature ?? c.temperature ?? 0))}°`],
                    ["Humidity", (c: any) => `${c.weather?.humidity ?? c.humidity ?? "—"}%`],
                    ["PM2.5", (c: any) => Number(c.air_quality?.pm25 ?? c.pm25 ?? 0).toFixed(1)],
                    ["Score", (c: any) => Math.round(Number(c.score ?? c.livability_score ?? 0))],
                  ].map(([label, fn]) => (
                    <tr key={String(label)} className="border-b border-white/5">
                      <td className="py-2.5 px-3 font-semibold">{label as string}</td>
                      {items.map((c) => <td key={c.name || c.city} className="py-2.5 px-3">{(fn as any)(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>Multi-Dimensional Comparison</SectionTitle>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis stroke="rgba(255,255,255,0.05)" tick={false} />
                  {items.map((c, i) => {
                    const name = c.name || c.city || `c${i}`;
                    return <Radar key={name} dataKey={name} stroke={colors[i]} fill={colors[i]} fillOpacity={0.2} strokeWidth={2} />;
                  })}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {result?.summary && (
            <GlassCard>
              <SectionTitle>AI Summary</SectionTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
