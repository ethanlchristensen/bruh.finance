import { createFileRoute } from "@tanstack/react-router";
import BillsPage from "@/features/bills/main";

export const Route = createFileRoute("/_protected/bills")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BillsPage />;
}
