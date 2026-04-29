export const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://abdulahadalikhan12-cloud-intelligence.hf.space";
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export type City = {
  name: string;
  country?: string;
  lat: number;
  lon: number;
  [k: string]: unknown;
};

export const api = {
  health: () => request<{ status: string }>("/health"),
  citiesAll: () => request<City[] | { cities: City[] }>("/api/v1/cities/all"),
  citiesSearch: (q: string) => request<City[] | { results: City[] }>(`/api/v1/cities/search?q=${encodeURIComponent(q)}`),
  weatherCurrent: (city: string) => request<any>(`/api/v1/weather/current/${encodeURIComponent(city)}`),
  weatherForecast: (city: string) => request<any>(`/api/v1/weather/forecast/${encodeURIComponent(city)}`),
  airQualityCurrent: (city: string) => request<any>(`/api/v1/air-quality/current/${encodeURIComponent(city)}`),
  rankings: () => request<{ cleanest: any[]; most_polluted: any[] }>("/api/v1/air-quality/rankings"),
  analyze: (city: string) => request<any>(`/api/v1/agents/analyze/${encodeURIComponent(city)}`, { method: "POST" }),
  compare: (cities: string[]) => request<any>("/api/v1/agents/compare", { method: "POST", body: JSON.stringify(cities) }),
  semanticSearch: (query: string, top_k = 10) =>
    request<any>("/api/v1/agents/search", { method: "POST", body: JSON.stringify({ query, top_k }) }),
};

// Normalize messy backend responses
export function normalizeCities(data: any): City[] {
  const arr = Array.isArray(data) ? data : data?.cities || data?.results || data?.data || [];
  return arr
    .map((c: any) => ({
      name: c.name || c.city || c.city_name || "",
      country: c.country || c.country_name || "",
      lat: Number(c.lat ?? c.latitude ?? c.coordinates?.lat ?? 0),
      lon: Number(c.lon ?? c.lng ?? c.longitude ?? c.coordinates?.lon ?? c.coordinates?.lng ?? 0),
      ...c,
    }))
    .filter((c: City) => c.name);
}

// AQI helpers
export function aqiCategory(aqi: number): { label: string; color: string; cssVar: string } {
  if (aqi <= 50) return { label: "Good", color: "#10b981", cssVar: "var(--success)" };
  if (aqi <= 100) return { label: "Moderate", color: "#f59e0b", cssVar: "var(--warning)" };
  if (aqi <= 150) return { label: "Unhealthy (SG)", color: "#f97316", cssVar: "var(--warning)" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444", cssVar: "var(--danger)" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#a855f7", cssVar: "var(--critical)" };
  return { label: "Hazardous", color: "#dc2626", cssVar: "var(--critical)" };
}

export function pickAqi(obj: any): number {
  if (!obj) return 0;
  return Number(
    obj.aqi ?? obj.AQI ?? obj.us_aqi ?? obj.air_quality?.aqi ?? obj.current?.aqi ?? obj.value ?? 0
  );
}
