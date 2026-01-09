"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/send-emails": "Email Reports",
  "/analytics": "Analytics",
  "/settings": "Settings"
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Don't show breadcrumb on home page
  if (pathname === "/") return null;

  const pathSegments = pathname.split("/").filter(Boolean);
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link 
        href="/" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = "/" + pathSegments.slice(0, index + 1).join("/");
        const isLast = index === pathSegments.length - 1;
        const label = routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
        
        return (
          <div key={path} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link 
                href={path}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}