import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, Trophy, GitCompare, Sparkles, Globe2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { healthQuery } from "@/lib/queries";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/map", label: "Map", icon: Map },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/search", label: "AI Search", icon: Sparkles },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: health, isError } = useQuery(healthQuery);
  const online = !!health && !isError;

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/5 bg-card/40 backdrop-blur-xl">
      <div className="p-6 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-hero-gradient flex items-center justify-center glow-primary">
          <Globe2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-gradient leading-none">Cloud Intel</div>
          <div className="text-[10px] text-muted-foreground tracking-wider mt-1">PLATFORM</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? path === to : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to as any}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group ${
                active
                  ? "bg-primary/15 text-primary-glow shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${active ? "text-primary-glow" : ""}`} />
              <span className="font-medium">{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-glow animate-pulse-glow" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 m-3 glass rounded-xl">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-success animate-pulse-glow" : "bg-danger"}`} />
          <span className="text-xs text-muted-foreground">{online ? "API Online" : "API Offline"}</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-white/10 px-2 py-2 flex justify-around">
      {NAV.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? path === to : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to as any}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              active ? "text-primary-glow" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
