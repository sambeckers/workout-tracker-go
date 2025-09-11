import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Play, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const actions = [
    {
      icon: Plus,
      label: "New Workout",
      description: "Start a new session",
      href: "/workout/new",
      variant: "hero" as const,
    },
    {
      icon: Play,
      label: "Quick Start",
      description: "Begin last workout",
      href: "/workout/quick",
      variant: "default" as const,
    },
    {
      icon: Target,
      label: "Set Goal",
      description: "Define new target",
      href: "/goals/new",
      variant: "secondary" as const,
    },
    {
      icon: TrendingUp,
      label: "View Progress",
      description: "Check your stats",
      href: "/progress",
      variant: "accent" as const,
    },
  ];

  return (
    <Card className="bg-gradient-card shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Button
                variant={action.variant}
                className="w-full h-auto p-4 flex-col gap-2 text-left"
              >
                <action.icon className="h-6 w-6" />
                <div>
                  <div className="font-semibold text-sm">{action.label}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;