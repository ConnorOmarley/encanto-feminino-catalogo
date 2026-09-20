import { useQuery } from "@tanstack/react-query";
import { brand, type BrandSettings } from "@/data/catalog";
import { fetchBrandSettings, supabase } from "@/lib/catalog-api";

export function useBrand(): BrandSettings {
  const query = useQuery({
    queryKey: ["brand-settings"],
    queryFn: fetchBrandSettings,
    enabled: Boolean(supabase),
    refetchInterval: 30000,
  });
  return { ...brand, ...(query.data ?? {}) };
}
