import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/beauty")({
  head: () => ({ meta: [{ title: "Beauty — Dealory" }, { name: "description", content: "Radiant essentials for luminous skin." }] }),
  component: () => <CategoryPage slug="beauty" />,
});
