export type Category = "fashion" | "shoes" | "electronics" | "beauty" | "health";

export interface ProductSpec { label: string; value: string }

export interface Product {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  rating: number;
  reviews: number;
  views: number;
  category: Category;
  image: string;
  gallery: string[];
  highlights: string[];
  specs: ProductSpec[];
  badge?: "new" | "trending" | "top" | null;
  tag?: string | null;
  recommendedIds: string[];
  buyUrl?: string | null;
}

export type SectionKey = "featured" | "trending" | "newArrivals" | "topRated";

export const SECTION_META: Record<SectionKey, { eyebrow: string; title: string }> = {
  featured: { eyebrow: "Featured", title: "The current essentials" },
  trending: { eyebrow: "Trending", title: "What the world is choosing" },
  newArrivals: { eyebrow: "Just arrived", title: "New arrivals" },
  topRated: { eyebrow: "Adored", title: "Top rated" },
};

export type HomeSections = Record<SectionKey, string[]>;

export interface ThemeSettings {
  heroCards: [string, string, string];
  categoryImages: Record<Category, string>;
}
