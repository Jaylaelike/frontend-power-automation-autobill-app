"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Zap, 
  Activity,
  Mail
} from "lucide-react";



export function Navbar() {

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Sidebar Trigger and Brand */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <Link href="/" className="flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Power Monitor
              </span>
            </Link>
          </div>
        </div>

        {/* Right side - Actions, Status and Theme Toggle */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Link href="/send-emails">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <Mail className="h-4 w-4" />
              Send Reports
            </Button>
          </Link>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Activity className="h-3 w-3 animate-pulse text-green-500" />
            <span className="hidden sm:inline">Live</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}