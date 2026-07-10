import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  ScanEye,
  Scale,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  hideFor?: Role[];
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
  { label: "Vacancies", href: "/hr/vacancies", icon: Briefcase },
  { label: "Candidates", href: "/hr/vacancies/v-teamlead/ranking", icon: Users, badge: 12 },
  { label: "Analytics", href: "/hr/vacancies/v-teamlead/analytics", icon: BarChart3 },
  { label: "Bias", href: "/hr/bias", icon: ScanEye, badge: 1, hideFor: ["Observer"] },
  { label: "Calibration", href: "/hr/calibration", icon: Scale, hideFor: ["Observer"] },
  { label: "Audit", href: "/hr/audit", icon: ScrollText },
];

export const VACANCY_SUBNAV = (vid: string) => [
  { label: "Ranking", href: `/hr/vacancies/${vid}/ranking` },
  { label: "Compare", href: `/hr/vacancies/${vid}/compare` },
  { label: "Analytics", href: `/hr/vacancies/${vid}/analytics` },
  { label: "Config", href: `/hr/vacancies/${vid}/config` },
  { label: "Invitations", href: `/hr/vacancies/${vid}/invitations` },
];

export const ROLES: Role[] = ["HR", "Head", "Technical", "Observer"];

export { Settings };
