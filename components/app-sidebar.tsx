"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Mail,
  BarChart3,
  Settings,
  Zap,
  Activity,
  Users,
  Database,
  FileText,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Calculator,
  ClipboardList,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNavigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Real-time power monitoring"
  },
  {
    name: "Billing",
    href: "/billing",
    icon: Calculator,
    description: "คำนวณค่าไฟฟ้า"
  },
  {
    name: "Billing Tester",
    href: "/billing/test",
    icon: ClipboardList,
    description: "Manual verification tool"
  },
  {
    name: "Email Reports",
    href: "/send-emails",
    icon: Mail,
    description: "Send power reports"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Power usage analytics",
    disabled: true
  }
];

const dataNavigation = [
  {
    name: "Stations",
    href: "/stations",
    icon: Zap,
    description: "Manage monitoring stations",
    disabled: true
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    description: "User management",
    disabled: true
  },
  {
    name: "Database",
    href: "/database",
    icon: Database,
    description: "Data management",
    disabled: true
  }
];

const systemNavigation = [
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Generated reports",
    disabled: true
  },
  {
    name: "Alerts",
    href: "/alerts",
    icon: Bell,
    description: "System notifications",
    disabled: true
  },
  {
    name: "Security",
    href: "/security",
    icon: Shield,
    description: "Security settings",
    disabled: true
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System configuration",
    disabled: false
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Power Monitor</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3 animate-pulse text-green-500" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                      disabled={item.disabled}
                    >
                      <Link href={item.disabled ? "#" : item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        {item.disabled && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Data Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Data Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                      disabled={item.disabled}
                    >
                      <Link href={item.disabled ? "#" : item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        {item.disabled && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                      disabled={item.disabled}
                    >
                      <Link href={item.disabled ? "#" : item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        {item.disabled && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help & Support">
              <Link href="/help">
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}