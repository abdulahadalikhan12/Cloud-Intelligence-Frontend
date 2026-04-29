import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Wind, Globe, Leaf, Bot } from "lucide-react";
import { citiesQuery, rankingsQuery } from "@/lib/queries";
import { GlassCard, AqiBadge, SectionTitle, Skeleton } from "@/components/ui-bits";
import { CountUp } from "@/components/CountUp";
import { aqiCategory, pickAqi } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cloud Intelligence Platform" },
      { name: "description", content: "Real-time global weather and air quality dashboard with AI insights." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(citiesQuery);
    context.queryClient.prefetchQuery(rankingsQuery);
  },
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, suffix = "", delay = 0, color = "var(--primary-glow)" }: any) {
  return (
    <GlassCard delay={delay} className="relative overflow-hidden">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-3xl font-bold tabular-nums">
        {typeof value === "number" ? <CountUp value={value} suffix={suffix} /> : value}
      </div>
    </GlassCard>
  );
}

function RankingCard({ title, items, delay }: { title: string; items: any[]; delay: number }) {
  return (
    <GlassCard delay={delay}>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, i) => {
          const aqi = pickAqi(item);
          const name = item.city || item.name || item.city_name;
          const country = item.country || "";
          return (
            <Link
              key={`${name}-${i}`}
              to={"/city/$cityName" as any}
              params={{ cityName: name } as any}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all group"
            >
              <span className="w-6 text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate group-hover:text-primary-glow transition-colors">{name}</div>
                {country && <div className="text-xs text-muted-foreground truncate">{country}</div>}
              </div>
              <AqiBadge aqi={aqi} size="sm" />
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Dashboard() {
  const { data: cities } = useQuery(citiesQuery);
  const { data: rankings, isLoading: rankLoading } = useQuery(rankingsQuery);

  const cleanest = rankings?.cleanest ?? [];
  const polluted = rankings?.most_polluted ?? [];
  const allRanked = [...cleanest, ...polluted];
  const avgAqi = allRanked.length ? allRanked.reduce((s, c) => s + pickAqi(c), 0) / allRanked.length : 0;
  const goodCount = allRanked.filter((c) => pickAqi(c) <= 50).length;

  return (
    <div className="px-4 lg:px-8 py-6 space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 lg:p-12 glow-primary"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative z-10 max-w-2xl">
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-extrabold tracking-tight text-white"
          >
            Cloud Intelligence<br/>Platform
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-4 text-base lg:text-lg text-white/80 max-w-xl"
          >
            Real-time environmental intelligence for 120+ global cities — AI-powered insights, forecasts, and recommendations.
          </motion.p>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Link
              to="/map"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3 text-sm font-semibold hover:scale-105 transition-transform shadow-xl"
            >
              Explore Map <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Globe} label="Cities Monitored" value={cities?.length ?? 0} delay={0.05} />
        <StatCard icon={Wind} label="Avg Global AQI" value={Number(avgAqi.toFixed(0))} delay={0.1} color={aqiCategory(avgAqi).color} />
        <StatCard icon={Leaf} label="Good Air Quality" value={goodCount} delay={0.15} color="#10b981" />
        <StatCard icon={Bot} label="Active AI Agents" value="3" delay={0.2} color="#a855f7" />
      </section>

      {/* Rankings */}
      <section>
        <SectionTitle sub="Top performers and worst offenders, updated in real-time">Air Quality Rankings</SectionTitle>
        <div className="grid lg:grid-cols-2 gap-4">
          {rankLoading ? (
            <>
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </>
          ) : (
            <>
              <RankingCard title="🌿 Cleanest Cities" items={cleanest} delay={0.05} />
              <RankingCard title="⚠️ Most Polluted" items={polluted} delay={0.1} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
