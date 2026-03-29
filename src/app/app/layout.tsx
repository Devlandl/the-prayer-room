import AppShell from "@/components/layout/app-shell";
import BottomNav from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <BottomNav />
    </>
  );
}
