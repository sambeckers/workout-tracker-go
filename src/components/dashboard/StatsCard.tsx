import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "accent";
}

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = "default" 
}: StatsCardProps) => {
  const getCardStyles = () => {
    switch (variant) {
      case "primary":
        return "text-white shadow-glow border-0";
      case "secondary":
        return "text-white shadow-lg border-0";
      case "accent":
        return "text-white shadow-lg border-0";
      default:
        return "shadow-md hover:shadow-lg border-0";
    }
  };

  const getCardBackground = () => {
    switch (variant) {
      case "primary":
        return { background: "var(--gradient-primary)" };
      case "secondary":
        return { background: "var(--gradient-secondary)" };
      case "accent":
        return { background: "var(--gradient-accent)" };
      default:
        return { background: "var(--gradient-card)" };
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "primary":
      case "secondary":
      case "accent":
        return "text-white/90";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className={`${getCardStyles()} transition-smooth`} style={getCardBackground()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${variant !== "default" ? "text-white/90" : "text-muted-foreground"}`}>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconStyles()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className={`text-xs ${variant !== "default" ? "text-white/80" : "text-muted-foreground"}`}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${
            trend.isPositive 
              ? variant !== "default" ? "text-white/90" : "text-success"
              : variant !== "default" ? "text-white/80" : "text-destructive"
          }`}>
            <span>
              {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
            </span>
            <span className={`ml-1 ${variant !== "default" ? "text-white/70" : "text-muted-foreground"}`}>
              vs last week
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;