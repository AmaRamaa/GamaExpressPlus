import {
  CarFront, Lightbulb, Frame, PanelTop, Package, LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  CarFront, Lightbulb, Frame, PanelTop, Package,
};

export function resolveIcon(name: string): LucideIcon {
  return iconMap[name] || Package;
}
