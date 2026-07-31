import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [{ title: "Health — Dealory" }, { name: "description", content: "Performance and wellness essentials." }] }),
  component: () => <CategoryPage slug="health" />,
});
