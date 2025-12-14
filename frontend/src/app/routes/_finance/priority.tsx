import { createFileRoute } from "@tanstack/react-router";
import PriorityPage from "@/features/priority/main";

export const Route = createFileRoute("/_finance/priority")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PriorityPage />;
}
