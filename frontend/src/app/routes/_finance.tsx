import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { ContentLayout } from "@/components/layouts";

export const Route = createFileRoute("/_finance")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <ContentLayout>
          <Outlet />
        </ContentLayout>
      </SidebarInset>
    </>
  );
}
