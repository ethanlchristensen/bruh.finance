import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContentLayoutProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
}

export function PageContentLayout({
  title,
  description,
  icon,
  actions,
  children,
  scrollable = true,
}: PageContentLayoutProps) {
  return (
    <main className="flex flex-col flex-1 min-h-0 px-4 py-10 md:px-8 overflow-hidden">
      <div className="mx-auto w-full max-w-5xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <header className="mb-8 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  {icon}
                </div>
              )}
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 ml-12">
              {description}
            </p>
          )}
        </header>
        <div
          className={cn(
            "flex flex-col gap-6 flex-1 min-h-0",
            scrollable ? "overflow-y-auto" : "overflow-hidden",
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
