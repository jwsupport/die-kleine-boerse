import {
  Layout,
  ShoppingBag,
  Palette,
  Cpu,
  Coffee,
  Car,
  Home,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  Icon: LucideIcon;
  fee: number;
}

export const CATEGORIES: Category[] = [
  { id: "living-interior",     label: "Living & Interior",      Icon: Layout,      fee: 0.00 },
  { id: "fashion-accessories", label: "Fashion & Accessories",  Icon: ShoppingBag, fee: 0.00 },
  { id: "art-collectibles",    label: "Art & Collectibles",     Icon: Palette,     fee: 0.00 },
  { id: "tech-electronics",    label: "Tech & Gadgets",         Icon: Cpu,         fee: 0.00 },
  { id: "leisure-hobbies",     label: "Leisure & Hobbies",      Icon: Coffee,      fee: 0.00 },
  { id: "vehicles-mobility",   label: "Vehicles & Mobility",    Icon: Car,         fee: 5.49 },
  { id: "real-estate",         label: "Real Estate",            Icon: Home,        fee: 9.49 },
  { id: "services",            label: "Services",               Icon: Briefcase,   fee: 0.00 },
];

export const categoryByLabel = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c])
) as Record<string, Category>;
