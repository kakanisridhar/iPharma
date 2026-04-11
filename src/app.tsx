import { RouterProvider } from "react-router";
import router from "./config/routes";
import { useEffect, useState } from "react";
import { getDb } from "./lib/db";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) =>
        setDbError(
          err instanceof Error ? err.message : "Unknown database error",
        ),
      );
  }, []);

  if (dbError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center space-y-3 max-w-md px-4">
          <div className="text-4xl">&#x26A0;</div>
          <h1 className="text-lg font-semibold">Database Error</h1>
          <p className="text-sm text-muted-foreground">{dbError}</p>
          <p className="text-xs text-muted-foreground">
            Try restarting the application. If the problem persists, your
            database file may be corrupted.
          </p>
        </div>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Initializing database…
          </p>
        </div>
      </div>
    );
  }

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-left" richColors={true} />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
