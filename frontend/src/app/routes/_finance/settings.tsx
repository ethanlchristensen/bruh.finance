import { createFileRoute } from "@tanstack/react-router";
import SetupPage from "@/features/settings/main";

export const Route = createFileRoute("/_finance/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SetupPage />;
}
