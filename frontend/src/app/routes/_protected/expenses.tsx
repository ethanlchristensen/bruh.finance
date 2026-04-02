import { createFileRoute } from "@tanstack/react-router";
import ExpensesPage from "@/features/expenses/main";

export const Route = createFileRoute("/_protected/expenses")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ExpensesPage />;
}
