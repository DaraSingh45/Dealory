import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/shoes")({
  head: () => ({ meta: [{ title: "Shoes — Dealory" }, { name: "description", content: "Iconic silhouettes and premium sneakers." }] }),
  component: () => <CategoryPage slug="shoes" />,
});
