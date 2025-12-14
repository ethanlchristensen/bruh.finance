import * as React from "react";
import { MessageCircle, ChartBarBig, TrendingUp, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: ChartBarBig,
      isActive: true,
    },
    {
      title: "Priority",
      url: "/priority",
      icon: TrendingUp,
      isActive: false,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeItem = React.useMemo(
    () =>
      data.navMain.find((item) => item.url === location.pathname) ||
      data.navMain[0],
    [location.pathname],
  );

  return (
    <>
      {/* This is the first sidebar */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r overflow-hidden *:data-[sidebar=sidebar]:flex-row h-screen"
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      asChild
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <Link to={item.url} search={{}}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {
            <NavUser
              user={{
                id: 101,
                username: "john_doe",
                email: "john.doe@example.com",
                first_name: "John",
                last_name: "Doe",
                profile: {
                  bio: "Passionate software engineer with a love for open source and clean code.",
                  profile_image:
                    "https://example.com/images/john_doe_profile.jpg",
                },
              }}
            />
          }
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
