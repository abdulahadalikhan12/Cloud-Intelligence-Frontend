import { queryOptions } from "@tanstack/react-query";
import { api, normalizeCities } from "./api";

const HOUR = 1000 * 60 * 60;
const FIVE_MIN = 1000 * 60 * 5;

export const citiesQuery = queryOptions({
  queryKey: ["cities", "all"],
  queryFn: async () => normalizeCities(await api.citiesAll()),
  staleTime: HOUR,
});

export const rankingsQuery = queryOptions({
  queryKey: ["rankings"],
  queryFn: () => api.rankings(),
  staleTime: FIVE_MIN,
});

export const healthQuery = queryOptions({
  queryKey: ["health"],
  queryFn: () => api.health(),
  staleTime: 30_000,
  retry: 1,
});

export const analyzeQuery = (city: string) =>
  queryOptions({
    queryKey: ["analyze", city],
    queryFn: () => api.analyze(city),
    staleTime: FIVE_MIN,
    enabled: !!city,
  });

export const forecastQuery = (city: string) =>
  queryOptions({
    queryKey: ["forecast", city],
    queryFn: () => api.weatherForecast(city),
    staleTime: FIVE_MIN,
    enabled: !!city,
  });

export const searchCitiesQuery = (q: string) =>
  queryOptions({
    queryKey: ["search-cities", q],
    queryFn: async () => normalizeCities(await api.citiesSearch(q)),
    staleTime: FIVE_MIN,
    enabled: q.length > 0,
  });
