import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/settings/finance")({
  loader: () => {
    throw redirect({ to: "/settings", replace: true });
  },
  component: () => null,
});
