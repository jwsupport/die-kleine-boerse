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
}

export const CATEGORIES: Category[] = [
  { id: "living-interior",     label: "Living & Interior",      Icon: Layout },
  { id: "fashion-accessories", label: "Fashion & Accessories",  Icon: ShoppingBag },
  { id: "art-collectibles",    label: "Art & Collectibles",     Icon: Palette },
  { id: "tech-electronics",    label: "Tech & Gadgets",         Icon: Cpu },
  { id: "leisure-hobbies",     label: "Leisure & Hobbies",      Icon: Coffee },
  { id: "vehicles-mobility",   label: "Vehicles & Mobility",    Icon: Car },
  { id: "real-estate",         label: "Real Estate",            Icon: Home },
  { id: "services",            label: "Services",               Icon: Briefcase },
];

export const categoryByLabel = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c])
) as Record<string, Category>;
