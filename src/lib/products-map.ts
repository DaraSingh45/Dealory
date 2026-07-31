import type { Product, ProductSpec, Category } from "./products-types";

type Row = {
  id: string;
  title: string;
  description: string;
  long_description: string;
  price: number | string;
  rating: number | string;
  reviews: number;
  views?: number | null;
  category: string;
  image: string;
  gallery: string[];
  highlights: string[];
  specs: unknown;
  tag: string | null;
  badge: string | null;
  buy_url: string | null;
  recommended_ids: string[];
};

export function mapProduct(r: Row): Product {
  return {
    id: r.id.trim(),
    title: r.title,
    description: r.description,
    longDescription: r.long_description,
    price: Number(r.price),
    rating: Number(r.rating),
    reviews: r.reviews,
    views: Number(r.views ?? 0),
    category: r.category as Category,
    image: r.image,
    gallery: r.gallery ?? [],
    highlights: r.highlights ?? [],
    specs: Array.isArray(r.specs) ? (r.specs as ProductSpec[]) : [],
    tag: r.tag,
    badge: (r.badge ?? null) as Product["badge"],
    buyUrl: r.buy_url,
    recommendedIds: (r.recommended_ids ?? []).map((s) => s.trim()),
  };
}