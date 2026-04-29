import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { healthQuery } from "@/lib/queries";

import appCss from "../styles.css?url";

interface RouterContext { queryClient: QueryClient; }

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cloud Intelligence Platform — Real-time Global Environmental Monitoring" },
      { name: "description", content: "AI-powered weather and air quality intelligence for 120+ cities worldwide. Real-time monitoring, predictions, and recommendations." },
      { property: "og:title", content: "Cloud Intelligence Platform" },
      { property: "og:description", content: "Real-time environmental intelligence for 120+ global cities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="dark">{children}<Scripts /></body>
    </html>
  );
}

function ApiBanner() {
  const { isError } = useQuery(healthQuery);
  if (!isError) return null;
  return (
    <div className="px-4 py-2 text-xs text-center bg-warning/10 text-warning border-b border-warning/20">
      ⚠️ Backend is starting up. Some features may be temporarily unavailable.
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
          <ApiBanner />
          <TopBar />
          <main className="flex-1"><Outlet /></main>
        </div>
        <MobileNav />
      </div>
    </QueryClientProvider>
  );
}
