"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const sidebarItems = [
  { href: "/app", label: "My Prayers", icon: "📓" },
  { href: "/app/session", label: "Prayer Time", icon: "🕐" },
  { href: "/app/groups", label: "Groups", icon: "👥" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex md:flex-col md:w-60 bg-brand-dark border-r border-brand-border">
        <div className="p-4 border-b border-brand-border">
          <Link href="/app" className="flex items-center gap-2">
            <span className="text-2xl">🙏</span>
            <span className="font-bold text-brand-gold text-lg">
              The Prayer Room
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "text-brand-muted hover:text-brand-white hover:bg-brand-card"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-brand-border">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </aside>
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
