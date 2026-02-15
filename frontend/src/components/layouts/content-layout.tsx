import * as React from "react";

import { ThemeToggle } from "../theme/theme-toggle";
type ContentLayoutProps = {
  children: React.ReactNode;
  fullHeight?: boolean;
};

export const ContentLayout = ({
  children,
  fullHeight = false,
}: ContentLayoutProps) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-sidebar flex shrink-0 items-center justify-end gap-1 px-4 py-1">
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      {fullHeight ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto py-6">
          <div className="mx-auto max-w-10xl px-4 py-6 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
