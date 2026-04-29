import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, MapPin } from "lucide-react";
import { citiesQuery, analyzeQuery } from "@/lib/queries";
import { MAPBOX_TOKEN, aqiCategory, pickAqi } from "@/lib/api";
import { AqiBadge, GlassCard, Skeleton } from "@/components/ui-bits";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map — Cloud Intelligence Platform" },
      { name: "description", content: "Interactive global map of air quality and weather across 120+ cities." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: cities } = useQuery(citiesQuery);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ name: string; lat: number; lon: number; aqi: number } | null>(null);

  // Mock AQIs deterministically per-city for marker color (real AQI fetched on click)
  const aqiFor = (name: string) => {
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return (h % 200) + 10;
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <GlassCard>
          <h2 className="text-xl font-bold mb-2">Map preview unavailable</h2>
          <p className="text-sm text-muted-foreground">
            Add a <code className="px-1.5 py-0.5 rounded bg-white/5">VITE_MAPBOX_TOKEN</code> environment variable to enable the interactive map.
            Cities loaded: <span className="text-foreground font-semibold">{cities?.length ?? 0}</span>
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto scrollbar-thin pr-2">
            {cities?.map((c) => (
              <Link key={c.name} to={"/city/$cityName" as any} params={{ cityName: c.name } as any}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary-glow" /> {c.name}
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 10, latitude: 25, zoom: 1.6 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        {cities?.map((c) => {
          const aqi = aqiFor(c.name);
          const cat = aqiCategory(aqi);
          const isSel = selected === c.name;
          return (
            <Marker key={c.name} longitude={c.lon} latitude={c.lat} anchor="center">
              <button
                onMouseEnter={() => setHover({ name: c.name, lat: c.lat, lon: c.lon, aqi })}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(c.name)}
                className="relative block"
                style={{ width: 14, height: 14 }}
              >
                <span className="absolute inset-0 rounded-full" style={{ background: cat.color, boxShadow: `0 0 12px ${cat.color}` }} />
                {isSel && <span className="absolute -inset-2 rounded-full animate-marker-pulse" style={{ background: cat.color, opacity: 0.4 }} />}
              </button>
            </Marker>
          );
        })}
        {hover && (
          <Popup longitude={hover.lon} latitude={hover.lat} closeButton={false} offset={14} anchor="bottom">
            <div className="text-xs">
              <div className="font-semibold">{hover.name}</div>
              <div className="text-muted-foreground">AQI {Math.round(hover.aqi)}</div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 glass-strong rounded-xl p-3 text-xs space-y-1.5">
        <div className="font-semibold mb-1">AQI Legend</div>
        {[[0,50,"Good"],[51,100,"Moderate"],[101,150,"USG"],[151,200,"Unhealthy"],[201,300,"Very Unhealthy"]].map(([lo,_hi,lbl])=>{
          const c = aqiCategory(Number(lo));
          return (
            <div key={String(lbl)} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {lbl}
            </div>
          );
        })}
      </div>

      {/* Slide-in panel */}
      <AnimatePresence>
        {selected && <CityPanel city={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function CityPanel({ city, onClose }: { city: string; onClose: () => void }) {
  const { data, isLoading } = useQuery(analyzeQuery(city));
  const aqi = pickAqi(data?.air_quality ?? data);
  const w = data?.weather ?? data?.current_weather ?? {};
  const recs: any[] = data?.recommendations ?? data?.analysis?.recommendations ?? [];

  return (
    <motion.aside
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="absolute top-0 right-0 h-full w-full sm:w-[400px] glass-strong border-l border-white/10 overflow-y-auto scrollbar-thin"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-card/80 backdrop-blur-xl border-b border-white/5">
        <h3 className="text-lg font-bold">{city}</h3>
        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-40" /><Skeleton className="h-24" /></div>
        ) : (
          <>
            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase text-muted-foreground tracking-wider">Current Weather</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">{Math.round(Number(w.temperature_c ?? 0))}°</span>
                <span className="text-sm text-muted-foreground">{w.condition || "—"}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><div className="text-muted-foreground">Humidity</div><div className="font-semibold tabular-nums">{w.humidity_pct ?? "—"}%</div></div>
                <div><div className="text-muted-foreground">Wind</div><div className="font-semibold tabular-nums">{w.wind_speed_kmh ?? "—"} km/h</div></div>
                <div><div className="text-muted-foreground">Pressure</div><div className="font-semibold tabular-nums">{w.pressure_hpa ?? "—"} hPa</div></div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase text-muted-foreground tracking-wider">Air Quality</div>
                <AqiBadge aqi={aqi} />
              </div>
              <div className="mt-3 text-5xl font-extrabold tabular-nums" style={{ color: aqiCategory(aqi).color }}>
                {Math.round(aqi)}
              </div>
            </div>
            {recs.length > 0 && (
              <div className="glass rounded-xl p-4">
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">AI Recommendations</div>
                <ul className="space-y-2 text-sm">
                  {recs.slice(0, 4).map((r, i) => (
                    <li key={i} className="flex gap-2"><span>{r.icon || "💡"}</span><span>{r.title || r.text || r.message || String(r)}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              to={"/city/$cityName" as any} params={{ cityName: city } as any}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Full Analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </motion.aside>
  );
}
