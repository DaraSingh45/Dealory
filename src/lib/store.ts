import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProducts, getProduct, getTheme, getSections,
} from "./products.functions";
import {
  createProduct, updateProduct, deleteProduct,
  saveTheme, saveSections,
} from "./admin.functions";
import type { Product, ThemeSettings, HomeSections, Category } from "./products-types";
import { CATEGORIES } from "@/data/products";

export const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });

export const themeQueryOptions = queryOptions({
  queryKey: ["theme"],
  queryFn: () => getTheme(),
});

export const sectionsQueryOptions = queryOptions({
  queryKey: ["sections"],
  queryFn: () => getSections(),
});

export function useProducts() {
  return useQuery(productsQueryOptions);
}
export function useProduct(id: string) {
  return useQuery(productQueryOptions(id));
}
export function useTheme() {
  return useQuery(themeQueryOptions);
}
export function useSections() {
  return useQuery(sectionsQueryOptions);
}

// Convenience derivations
export function byCategoryFrom(products: Product[] | undefined, cat: Category) {
  return (products ?? []).filter((p) => p.category === cat);
}
export function findById(products: Product[] | undefined, id: string) {
  return (products ?? []).find((p) => p.id === id);
}
export function relatedFrom(products: Product[] | undefined, p: Product | null | undefined): Product[] {
  if (!p) return [];
  const all = products ?? [];
  if (p.recommendedIds && p.recommendedIds.length) {
    const map = new Map(all.map((x) => [x.id, x]));
    return p.recommendedIds.map((id) => map.get(id)).filter(Boolean).slice(0, 8) as Product[];
  }
  return all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 8);
}

// Fallback hero/category images so the UI never shows blank tiles before
// the theme settings query resolves.
export const FALLBACK_HERO: [string, string, string] = [
  "https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&auto=format&fit=crop&q=80",
];

export function resolveHero(t?: ThemeSettings): [string, string, string] {
  if (!t) return FALLBACK_HERO;
  return [
    t.heroCards[0] || FALLBACK_HERO[0],
    t.heroCards[1] || FALLBACK_HERO[1],
    t.heroCards[2] || FALLBACK_HERO[2],
  ];
}
export function resolveCategoryImage(t: ThemeSettings | undefined, cat: Category): string {
  const fromTheme = t?.categoryImages?.[cat];
  if (fromTheme) return fromTheme;
  return CATEGORIES.find((c) => c.slug === cat)?.image ?? "";
}

// ---------- Admin mutations ----------

export function useCreateProduct() {
  const qc = useQueryClient();
  const fn = useServerFn(createProduct);
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
export function useUpdateProduct() {
  const qc = useQueryClient();
  const fn = useServerFn(updateProduct);
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      const id = (variables as { data: { id: string } }).data.id;
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}
export function useDeleteProduct() {
  const qc = useQueryClient();
  const fn = useServerFn(deleteProduct);
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
export function useSaveTheme() {
  const qc = useQueryClient();
  const fn = useServerFn(saveTheme);
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["theme"] }),
  });
}
export function useSaveSections() {
  const qc = useQueryClient();
  const fn = useServerFn(saveSections);
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

export type { Product, HomeSections, ThemeSettings, Category };
export { SECTION_META } from "./products-types";
export type { SectionKey } from "./products-types";
