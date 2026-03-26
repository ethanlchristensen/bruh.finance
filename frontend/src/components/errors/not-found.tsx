import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const NotFound = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center text-center p-4">
      <h1 className="text-7xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        The page you are looking for does not exist or you do not have
        permission to view it.
      </p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
};
