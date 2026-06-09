import {
  BarChart3,
  Bot,
  CalendarDays,
  FileText,
  Layers3,
  LayoutDashboard,
  Megaphone,
  Palette,
  Plug,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type RouteKey =
  | "executive"
  | "media"
  | "actions"
  | "social"
  | "creative"
  | "reports"
  | "pdm"
  | "intelligence"
  | "integrations"
  | "settings";

export const navItems = [
  { key: "executive", label: "Visão Executiva", icon: LayoutDashboard },
  { key: "media", label: "Media Ops", icon: BarChart3 },
  { key: "actions", label: "Central de Ações", icon: ShieldCheck },
  { key: "social", label: "Social Ops", icon: CalendarDays },
  { key: "creative", label: "Creative Ops", icon: Palette },
  { key: "reports", label: "Relatórios", icon: FileText },
  { key: "pdm", label: "PDM", icon: Layers3 },
  { key: "intelligence", label: "Inteligência do Cliente", icon: Bot },
  { key: "integrations", label: "Integrações", icon: Plug },
  { key: "settings", label: "Configurações", icon: Settings },
] as const satisfies Array<{ key: RouteKey; label: string; icon: typeof Megaphone }>;
