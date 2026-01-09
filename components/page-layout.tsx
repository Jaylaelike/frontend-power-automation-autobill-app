import { ReactNode } from "react";
import { Breadcrumb } from "./breadcrumb";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className={`flex flex-col gap-6 p-4 md:p-8 lg:p-12 ${className}`}>
      <Breadcrumb />
      {children}
    </div>
  );
}