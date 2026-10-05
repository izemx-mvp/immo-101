import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_app")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => s,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
