"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Smartphone,
  Package,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/login/actions";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/models", label: "Models", icon: Smartphone },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/seller", label: "Sell", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-bold tracking-tight">Inventory</h2>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2 space-y-1">
        <ChangePasswordDialog />
        <form action={signOutAction}>
          <Button
            variant="ghost"
            className="w-full justify-start"
            type="submit"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
