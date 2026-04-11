import { Outlet } from "react-router";
import { AppHeader } from "./app-header";
import { useState } from "react";

export function AppLayout() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="container mx-auto overflow-x-hidden bg-background">
      <div className="fixed inset-x-0 top-0 z-10 border-b border-b-destructive">
        <AppHeader />
      </div>
      <main className="flex flex-col px-4 pt-16.25 sm:px-6 lg:px-8 min-h-dvh gap-2">
        <div className="flex flex-col bg-background p-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
