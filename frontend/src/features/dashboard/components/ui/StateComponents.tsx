export function ErrorState({ error }: { error: string }) {
  if (
    error === "NO_ACCOUNT" ||
    error.includes("404") ||
    error.includes("Not Found")
  ) {
    // You might want to handle redirect here or in the parent
    // For now, let's just show a clear message and a link
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg font-semibold mb-4">No Account Found</div>
        <p className="text-muted-foreground mb-4">
          Please set up your account in settings.
        </p>
        <a href="/settings" className="text-primary underline">
          Go to Settings
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen text-red-500">
      Error: {error}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
