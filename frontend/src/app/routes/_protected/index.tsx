import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/features/dashboard/main";

export const Route = createFileRoute("/_protected/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  return <DashboardPage />;
}
