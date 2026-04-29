import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets, Wind, Gauge, Thermometer } from "lucide-react";
import { analyzeQuery, forecastQuery } from "@/lib/queries";
import { GlassCard, AqiBadge, Skeleton, SectionTitle } from "@/components/ui-bits";
import { aqiCategory, pickAqi } from "@/lib/api";

export const Route = createFileRoute("/city/$cityName")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.cityName} — Cloud Intelligence` },
      { name: "description", content: `Real-time weather, air quality and AI insights for ${params.cityName}.` },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(analyzeQuery(params.cityName));
    context.queryClient.prefetchQuery(forecastQuery(params.cityName));
  },
  component: CityDetail,
});

function Gauge100({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 50, c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <motion.circle cx="60" cy="60" r={r} stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{Math.round(v)}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function PollutantBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct < 33 ? "#10b981" : pct < 66 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value.toFixed(1)} µg/m³</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
}

function CityDetail() {
  const { cityName } = useParams({ from: "/city/$cityName" });
  const { data: analysis, isLoading } = useQuery(analyzeQuery(cityName));
  const { data: forecast } = useQuery(forecastQuery(cityName));

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-32" />
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" /><Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const aq = analysis?.air_quality ?? analysis ?? {};
  const w = analysis?.weather ?? analysis?.current_weather ?? {};
  const aqi = pickAqi(aq);
  const cat = aqiCategory(aqi);
  const score = Number(analysis?.livability_score ?? analysis?.score ?? Math.max(0, 100 - aqi / 3));
  const insights: any[] = analysis?.insights ?? analysis?.analysis?.insights ?? [];
  const recs: any[] = analysis?.recommendations ?? analysis?.analysis?.recommendations ?? [];
  const cluster = analysis?.cluster ?? analysis?.cluster_label ?? "—";
  const pollutants = {
    pm25: Number(aq.pm25 ?? aq.pm2_5 ?? aq.pollutants?.pm25 ?? 0),
    pm10: Number(aq.pm10 ?? aq.pollutants?.pm10 ?? 0),
    no2: Number(aq.no2 ?? aq.pollutants?.no2 ?? 0),
    o3: Number(aq.o3 ?? aq.pollutants?.o3 ?? 0),
  };
  const days: any[] = forecast?.forecast ?? forecast?.daily ?? forecast?.days ?? (Array.isArray(forecast) ? forecast : []);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Header */}
      <GlassCard className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight">{cityName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{analysis?.country || ""} · {analysis?.coordinates ? `${analysis.coordinates.lat?.toFixed?.(2)}, ${analysis.coordinates.lon?.toFixed?.(2)}` : ""}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <AqiBadge aqi={aqi} size="lg" />
            <span className="px-3 py-1 rounded-full text-xs bg-primary/15 text-primary-glow border border-primary/20">{cluster}</span>
          </div>
        </div>
        <Gauge100 value={score} label="Livability" />
      </GlassCard>

      {/* Weather + AQ */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard delay={0.05}>
          <SectionTitle>Current Weather</SectionTitle>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-extrabold tabular-nums">{Math.round(Number(w.temperature ?? w.temp ?? 0))}°</span>
            <span className="text-lg text-muted-foreground">{w.condition ?? w.description ?? "—"}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { icon: Thermometer, label: "Feels Like", val: `${Math.round(Number(w.feels_like ?? w.temperature ?? 0))}°` },
              { icon: Droplets, label: "Humidity", val: `${w.humidity ?? "—"}%` },
              { icon: Wind, label: "Wind", val: `${w.wind_speed ?? w.wind ?? "—"} m/s` },
              { icon: Gauge, label: "Pressure", val: `${w.pressure ?? "—"} hPa` },
            ].map(({ icon: I, label, val }) => (
              <div key={label} className="glass rounded-lg p-3 flex items-center gap-3">
                <I className="h-4 w-4 text-primary-glow" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-sm font-semibold tabular-nums">{val}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <SectionTitle>Air Quality</SectionTitle>
          <div className="rounded-xl p-5 mb-4" style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}33` }}>
            <div className="text-xs uppercase tracking-wider opacity-80" style={{ color: cat.color }}>{cat.label}</div>
            <div className="text-5xl font-extrabold tabular-nums mt-1" style={{ color: cat.color }}>{Math.round(aqi)}</div>
          </div>
          <div className="space-y-3">
            <PollutantBar label="PM2.5" value={pollutants.pm25} max={75} />
            <PollutantBar label="PM10" value={pollutants.pm10} max={150} />
            <PollutantBar label="NO2" value={pollutants.no2} max={200} />
            <PollutantBar label="O3" value={pollutants.o3} max={180} />
          </div>
        </GlassCard>
      </div>

      {/* Forecast */}
      {days.length > 0 && (
        <section>
          <SectionTitle>7-Day Forecast</SectionTitle>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {days.slice(0, 7).map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 min-w-[120px] text-center">
                <div className="text-xs text-muted-foreground">{d.date || d.day || `Day ${i+1}`}</div>
                <div className="text-2xl my-2">{d.icon || "⛅"}</div>
                <div className="text-sm font-semibold tabular-nums">{Math.round(Number(d.high ?? d.temp_max ?? d.max ?? 0))}° / {Math.round(Number(d.low ?? d.temp_min ?? d.min ?? 0))}°</div>
                <div className="text-[10px] text-muted-foreground mt-1">💧 {d.rain ?? d.precipitation ?? 0}%</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <GlassCard className="border border-primary/30 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]">
          <SectionTitle sub="Generated by Cloud Intel agents">🤖 AI Intelligence Report</SectionTitle>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                <span className="px-2 py-0.5 h-fit rounded-full text-[10px] uppercase font-semibold bg-primary/20 text-primary-glow border border-primary/30">
                  {ins.severity || "info"}
                </span>
                <div>
                  <div className="text-sm font-semibold">{ins.title || ins.headline || "Insight"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ins.description || ins.text || String(ins)}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <section>
          <SectionTitle>Recommendations</SectionTitle>
          <div className="grid md:grid-cols-2 gap-3">
            {recs.map((r, i) => (
              <GlassCard key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{r.icon || "💡"}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{r.title || `Recommendation ${i+1}`}</h4>
                      {r.priority && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-warning/20 text-warning border border-warning/30">{r.priority}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.description || r.text || r.message || String(r)}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
