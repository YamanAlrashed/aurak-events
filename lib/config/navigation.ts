import {
  Archive,
  Bell,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  MapPin,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

/* ---------- Campus Events Admin ---------- */

export const CAMPUS_ADMIN_NAV: NavItem[] = [
  {
    href: "/campus-events/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/campus-events/admin/events",
    label: "Events",
    icon: CalendarDays,
  },
  {
    href: "/campus-events/admin/archive",
    label: "Archive",
    icon: Archive,
  },
];

/* ---------- Marketing Admin ---------- */

export const MARKETING_ADMIN_NAV: NavItem[] = [
  {
    href: "/marketing/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/marketing/admin/events",
    label: "Events",
    icon: CalendarDays,
  },
];

/* ---------- Campus Events User ---------- */

export const CAMPUS_USER_TABS: NavItem[] = [
  {
    href: "/campus-events/user",
    label: "Home",
    icon: CalendarCheck,
    exact: true,
  },
  {
    href: "/campus-events/user/locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    href: "/campus-events/user/my-events",
    label: "My Events",
    icon: Ticket,
  },
  {
    href: "/campus-events/user/notifications",
    label: "Alerts",
    icon: Bell,
  },
];

export function isNavItemActive(
  item: NavItem,
  pathname: string
): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );
}