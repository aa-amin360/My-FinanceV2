import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  History,
  Home,
  LayoutDashboard,
  LucideIcon,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

// Desktop sidebar links, in display order
export const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Planning", href: "/budget", icon: TrendingUp },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Savings", href: "/savings", icon: Wallet },
  { label: "Debt", href: "/debts", icon: CreditCard },
  { label: "Receivable", href: "/receivables", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Add History", href: "/add-history", icon: History },
];

// Mobile bottom bar links, in display order
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Planning", href: "/budget", icon: TrendingUp },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Savings", href: "/savings", icon: Wallet },
  { label: "Debt", href: "/debts", icon: CreditCard },
  { label: "Receivable", href: "/receivables", icon: Wallet },
  { label: "History", href: "/add-history", icon: History },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

// A link is active on its own page and on any nested page (e.g. /debts/12)
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
