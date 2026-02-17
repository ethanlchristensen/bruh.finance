import { createFileRoute } from "@tanstack/react-router";
import FinanceSettingsPage from "@/features/settings/account";

export const Route = createFileRoute("/_protected/settings")({
  component: FinanceSettingsPage,
});
