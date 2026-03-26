import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    const tokens = localStorage.getItem("auth_tokens");

    if (tokens) {
      try {
        const authTokens = JSON.parse(tokens);
        // Only redirect if token is valid and not expired
        if (authTokens.expires_at && authTokens.expires_at > Date.now()) {
          // REMOVED THROW REDIRECT TO PREVENT RACECONDITION
          // The router was trying to redirect because of the token before the 401 error could render
          return;
        } else {
          // Token expired, clear it
          console.log("[_auth] Token expired, clearing from storage");
          localStorage.removeItem("auth_tokens");
        }
      } catch (error) {
        // Invalid token format, clear it
        console.log("[_auth] Invalid token format, clearing from storage");
        localStorage.removeItem("auth_tokens");
      }
    }
  },
  component: () => (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Outlet />
    </div>
  ),
});
