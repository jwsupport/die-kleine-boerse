import {
  Layout, ShoppingBag, Palette, Cpu, Coffee, Car, Home, Briefcase,
  Dumbbell, BookOpen, Music, Gamepad2, Utensils, Leaf, PawPrint, Baby,
  Puzzle, GraduationCap, UserCheck, Hammer, Camera, Plane, Watch,
  HeartPulse, Tv, Tent, Bike, Anchor, Trophy, Film, Tractor, Sparkles,
  Ticket, Truck, Apple, Scissors, Heart, Recycle, Gem, Users, TrendingUp,
  Building2, Crown, Star, ChefHat, Search, Archive, Smartphone, Gauge, Layers,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  Icon: LucideIcon;
  fee: number;
}

export const CATEGORIES: Category[] = [
  { id: "living-interior",       label: "Living & Interior",         Icon: Layout,        fee: 0.00 },
  { id: "fashion-accessories",   label: "Fashion & Accessories",     Icon: ShoppingBag,   fee: 0.00 },
  { id: "art-collectibles",      label: "Art & Collectibles",        Icon: Palette,       fee: 0.00 },
  { id: "tech-electronics",      label: "Tech & Gadgets",            Icon: Cpu,           fee: 0.00 },
  { id: "leisure-hobbies",       label: "Leisure & Hobbies",         Icon: Coffee,        fee: 0.00 },
  { id: "vehicles-mobility",     label: "Vehicles & Mobility",       Icon: Car,           fee: 5.49 },
  { id: "real-estate",           label: "Real Estate",               Icon: Home,          fee: 9.49 },
  { id: "services",              label: "Services",                   Icon: Briefcase,     fee: 0.00 },
  { id: "sport-fitness",         label: "Sport & Fitness",           Icon: Dumbbell,      fee: 0.00 },
  { id: "books-media",           label: "Books & Media",             Icon: BookOpen,      fee: 0.00 },
  { id: "music-instruments",     label: "Music & Instruments",       Icon: Music,         fee: 0.00 },
  { id: "gaming-consoles",       label: "Gaming & Consoles",         Icon: Gamepad2,      fee: 0.00 },
  { id: "kitchen-cooking",       label: "Kitchen & Cooking",         Icon: Utensils,      fee: 0.00 },
  { id: "garden-plants",         label: "Garden & Plants",           Icon: Leaf,          fee: 0.00 },
  { id: "pets-accessories",      label: "Pets & Supplies",           Icon: PawPrint,      fee: 0.00 },
  { id: "baby-kids",             label: "Baby & Kids",               Icon: Baby,          fee: 0.00 },
  { id: "toys-games",            label: "Toys & Games",              Icon: Puzzle,        fee: 0.00 },
  { id: "education-school",      label: "Education",                 Icon: GraduationCap, fee: 0.00 },
  { id: "jobs-career",           label: "Jobs & Career",             Icon: UserCheck,     fee: 0.00 },
  { id: "handicraft-diy",        label: "Crafts & DIY",             Icon: Hammer,        fee: 0.00 },
  { id: "photo-camera",          label: "Photo & Camera",            Icon: Camera,        fee: 0.00 },
  { id: "travel-vacation",       label: "Travel & Vacation",         Icon: Plane,         fee: 0.00 },
  { id: "jewelry-watches",       label: "Jewelry & Watches",         Icon: Watch,         fee: 0.00 },
  { id: "health-beauty",         label: "Health & Beauty",           Icon: HeartPulse,    fee: 0.00 },
  { id: "home-appliances",       label: "Home Appliances",           Icon: Tv,            fee: 0.00 },
  { id: "outdoor-camping",       label: "Outdoor & Camping",         Icon: Tent,          fee: 0.00 },
  { id: "bicycles-ebikes",       label: "Bicycles & E-Bikes",        Icon: Bike,          fee: 0.00 },
  { id: "motorcycles",           label: "Motorcycles",               Icon: Gauge,         fee: 5.49 },
  { id: "boats-watersport",      label: "Boats & Watersports",       Icon: Anchor,        fee: 5.49 },
  { id: "sports-equipment",      label: "Sports Equipment",          Icon: Trophy,        fee: 0.00 },
  { id: "movies-entertainment",  label: "Film & Entertainment",      Icon: Film,          fee: 0.00 },
  { id: "agriculture-farming",   label: "Agriculture & Farming",     Icon: Tractor,       fee: 0.00 },
  { id: "cosmetics-care",        label: "Cosmetics & Care",          Icon: Sparkles,      fee: 0.00 },
  { id: "events-tickets",        label: "Events & Tickets",          Icon: Ticket,        fee: 0.00 },
  { id: "motorhomes-caravan",    label: "Motorhomes & Caravans",     Icon: Truck,         fee: 5.49 },
  { id: "food-drinks",           label: "Food & Drinks",             Icon: Apple,         fee: 0.00 },
  { id: "crafts-handmade",       label: "Handmade & Crafts",         Icon: Scissors,      fee: 0.00 },
  { id: "furniture",             label: "Furniture",                  Icon: Layers,        fee: 0.00 },
  { id: "dating",                label: "Dating & Contacts",         Icon: Heart,         fee: 0.00 },
  { id: "sustainability",        label: "Sustainability",             Icon: Recycle,       fee: 0.00 },
  { id: "luxury-goods",          label: "Luxury Goods",              Icon: Gem,           fee: 0.00 },
  { id: "childcare",             label: "Childcare",                  Icon: Users,         fee: 0.00 },
  { id: "finance-investment",    label: "Finance & Investment",      Icon: TrendingUp,    fee: 0.00 },
  { id: "office-stationery",     label: "Office & Stationery",       Icon: Building2,     fee: 0.00 },
  { id: "horse-equestrian",      label: "Equestrian & Horses",       Icon: Crown,         fee: 5.49 },
  { id: "esoteric-spiritual",    label: "Esoteric & Spiritual",      Icon: Star,          fee: 0.00 },
  { id: "food-catering",         label: "Catering & Events",         Icon: ChefHat,       fee: 0.00 },
  { id: "lost-found",            label: "Lost & Found",              Icon: Search,        fee: 0.00 },
  { id: "vintage-antiques",      label: "Vintage & Antiques",        Icon: Archive,       fee: 0.00 },
  { id: "smartphones-phones",    label: "Smartphones & Phones",      Icon: Smartphone,    fee: 0.00 },
];

export const categoryByLabel = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c])
) as Record<string, Category>;
