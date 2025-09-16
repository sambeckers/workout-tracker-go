import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Dumbbell,
  Target,
  TrendingUp,
  Trophy,
  Users,
  BarChart3,
  Clock,
} from "lucide-react";

export const heroBadgeText = "Hello there, ready to go?";
export const heroHeadline = "Ever wondered whether your fitness is actually improving?";
export const heroSubtext =
  "Join thousands of fitness enthusiasts who are achieving their goals with our comprehensive workout tracking, smart scheduling, and progress analytics platform.";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Plan your workouts with our intelligent scheduling system that adapts to your lifestyle.",
  },
  {
    icon: Dumbbell,
    title: "Exercise Library",
    description:
      "Access thousands of exercises with detailed instructions and video demonstrations.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description:
      "Set and achieve your fitness goals with our comprehensive tracking system.",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Monitor your progress with detailed analytics and performance insights.",
  },
  {
    icon: Trophy,
    title: "Achievement System",
    description:
      "Stay motivated with our gamified achievement system and milestone rewards.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Connect with like-minded fitness enthusiasts and share your journey.",
  },
];

export const benefits: string[] = [
  "Track your workouts and progress",
  "Personalized exercise recommendations",
  "Goal setting and achievement tracking",
  "Performance analytics and insights",
  "Community support and motivation",
];

export type Stat = {
  icon: LucideIcon;
  value: string;
  label: string;
  variant?: "primary" | "secondary" | "accent" | "card";
};

export const stats: Stat[] = [
  { icon: BarChart3, value: "50K+", label: "Active Users", variant: "primary" },
  { icon: Trophy, value: "1M+", label: "Workouts Completed", variant: "secondary" },
  { icon: Target, value: "95%", label: "Goal Achievement", variant: "accent" },
  { icon: Clock, value: "24/7", label: "Support", variant: "card" },
];
