'use client';

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/server/actions";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Templates", href: "/dashboard/templates" },
  { label: "Subscription", href: "/dashboard/subscription" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
        router.replace("/sign-in");
        router.refresh();
        toast.success("You have been logged out.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to logout.";
        toast.error(message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-semibold">P</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              Sites of Puri
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "bg-muted text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard/subscription">Upgrade</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              disabled={isPending}
            >
              {isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>
      </main>
    </div>
  );
}
