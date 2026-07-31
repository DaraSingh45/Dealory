import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/fashion")({
  head: () => ({ meta: [{ title: "Fashion — Dealory" }, { name: "description", content: "Premium fashion curated by Dealory." }] }),
  component: () => <CategoryPage slug="fashion" />,
});
