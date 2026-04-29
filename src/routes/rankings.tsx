import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rankingsQuery } from "@/lib/queries";
import { GlassCard, AqiBadge, SectionTitle, Skeleton } from "@/components/ui-bits";
import { pickAqi } from "@/lib/api";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Cloud Intelligence Platform" },
      { name: "description", content: "Cleanest and most polluted cities ranked by air quality index." },
    ],
  }),
  component: Rankings,
});

function List({ items, title, accent }: { items: any[]; title: string; accent: string }) {
  return (
    <GlassCard>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-1">
        {items.map((c, i) => {
          const aqi = pickAqi(c);
          const name = c.city || c.name || c.city_name;
          return (
            <Link key={i} to={"/city/$cityName" as any} params={{ cityName: name } as any}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums" style={{ background: `${accent}22`, color: accent }}>{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold group-hover:text-primary-glow transition-colors">{name}</div>
                <div className="text-xs text-muted-foreground">{c.country || ""}</div>
              </div>
              <AqiBadge aqi={aqi} />
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Rankings() {
  const { data, isLoading } = useQuery(rankingsQuery);
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Global AQ Rankings</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time leaderboards across monitored cities.</p>
      </div>
      {isLoading ? (
        <div className="grid lg:grid-cols-2 gap-4"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <List title="🌿 Cleanest Cities" items={data?.cleanest ?? []} accent="#10b981" />
          <List title="⚠️ Most Polluted" items={data?.most_polluted ?? []} accent="#ef4444" />
        </div>
      )}
    </div>
  );
}
