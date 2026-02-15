import { createFileRoute } from "@tanstack/react-router";
import CategoriesPage from "@/features/categories/main";

export const Route = createFileRoute("/_protected/categories")({
  component: CategoriesPage,
});
