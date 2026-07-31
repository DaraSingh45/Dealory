// Static catalogue metadata + types re-exports.
// Product data itself lives in the database — see src/lib/store.ts.
import catElectronics from "@/assets/cat-electronics.jpg";
import catBeauty from "@/assets/cat-beauty.jpg";
import catHealth from "@/assets/cat-health.jpg";

export type { Category, Product, ProductSpec } from "@/lib/products-types";
import type { Category } from "@/lib/products-types";

export const CATEGORIES: { slug: Category; label: string; description: string; image: string }[] = [
  { slug: "fashion", label: "Fashion", description: "Curated luxury apparel", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80" },
  { slug: "shoes", label: "Shoes", description: "Iconic silhouettes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80" },
  { slug: "electronics", label: "Electronics", description: "Future-forward gear", image: catElectronics },
  { slug: "beauty", label: "Beauty", description: "Radiant skincare essentials", image: catBeauty },
  { slug: "health", label: "Health", description: "Wellness & performance nutrition", image: catHealth },
];
