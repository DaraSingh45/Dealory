import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/electronics")({
  head: () => ({ meta: [{ title: "Electronics — Dealory" }, { name: "description", content: "Future-forward devices and gear." }] }),
  component: () => <CategoryPage slug="electronics" />,
});
