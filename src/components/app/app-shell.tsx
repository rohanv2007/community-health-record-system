"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, ChevronsLeft, ChevronsRight, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOutAction } from "@/app/actions";
import { navItems, roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ShellProfile = {
  full_name: string;
  role: AppRole;
  specialty?: string | null;
};

export function AppShell({
  children,
  profile,
  clinicName,
}: {
  children: React.ReactNode;
  profile: ShellProfile;
  clinicName: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = navItems.filter((item) => item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        items={visibleItems}
        profile={profile}
        clinicName={clinicName}
      />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[88px]" : "lg:pl-72")}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/92 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button className="lg:hidden" size="icon" variant="outline" aria-label="Open navigation">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] bg-navy p-0 text-white">
                <SidebarContent
                  collapsed={false}
                  items={visibleItems}
                  profile={profile}
                  clinicName={clinicName}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Community Health Record
              </p>
              <p className="font-heading text-lg font-semibold">{clinicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserPill profile={profile} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function DesktopSidebar({
  collapsed,
  setCollapsed,
  items,
  profile,
  clinicName,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  items: typeof navItems;
  profile: ShellProfile;
  clinicName: string;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-navy text-sidebar-foreground transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[88px]" : "w-72"
      )}
    >
      <SidebarContent collapsed={collapsed} items={items} profile={profile} clinicName={clinicName} />
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 rounded-full border border-sidebar-border bg-navy text-white hover:bg-teal"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
      </Button>
    </aside>
  );
}

function SidebarContent({
  collapsed,
  items,
  profile,
  clinicName,
  onNavigate,
}: {
  collapsed: boolean;
  items: typeof navItems;
  profile: ShellProfile;
  clinicName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-teal text-white shadow-soft">
          <Building2 className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-white">{clinicName}</p>
            <p className="truncate text-xs text-slate-400">Rural clinic operations</p>
          </div>
        )}
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-sidebar-accent hover:text-white",
                active && "bg-sidebar-accent text-white",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="size-4" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>
      <div className="p-3">
        <div className={cn("rounded-lg border border-sidebar-border p-3", collapsed && "p-2")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="size-9">
              <AvatarFallback className="bg-teal text-white">
                {profile.full_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{profile.full_name}</p>
                <Badge className="mt-1 bg-teal/20 text-teal-50 hover:bg-teal/20">
                  {roleLabels[profile.role]}
                </Badge>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button
              className="mt-3 w-full justify-start"
              variant="ghost"
              disabled={isPending}
              onClick={() => startTransition(() => signOutAction())}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

function UserPill({ profile }: { profile: ShellProfile }) {
  return (
    <div className="hidden items-center gap-2 rounded-lg border bg-card px-2 py-1.5 sm:flex">
      <Avatar className="size-8">
        <AvatarFallback>
          {profile.full_name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 pr-1">
        <p className="truncate text-sm font-semibold">{profile.full_name}</p>
        <p className="text-xs text-muted-foreground">{roleLabels[profile.role]}</p>
      </div>
    </div>
  );
}
