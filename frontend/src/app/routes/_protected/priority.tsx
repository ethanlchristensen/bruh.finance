import { createFileRoute } from "@tanstack/react-router";
import PriorityPage from "@/features/priority/main";

export const Route = createFileRoute("/_protected/priority")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PriorityPage />;
}
