import { Link, useLocation } from "react-router-dom";
import { Calendar, Target, TrendingUp, Book, Home, Dumbbell, Plus, Settings, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();

  const mainNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Calendar, label: "Schedule", path: "/schedule" },
    { icon: Book, label: "Exercises", path: "/exercises" },
    { icon: Target, label: "Goals", path: "/goals" },
    { icon: TrendingUp, label: "Progress", path: "/progress" },
  ];

  const quickActions = [
    { icon: Plus, label: "New Workout", path: "/workout/new" },
    { icon: Dumbbell, label: "Quick Session", path: "/workout/quick" },
    { icon: Target, label: "Add Goal", path: "/goals/new" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-primary rounded-md">
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sidebar-primary">FitTracker</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">SB</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-primary truncate">Sam Beckers</p>
          <p className="text-xs text-sidebar-foreground truncate">Free Plan</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-sidebar-foreground">
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <div className="space-y-1 px-2">
          {mainNavItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-8 px-2 text-sm font-normal",
                  isActivePath(item.path)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4 mx-2" />

        {/* Quick Actions */}
        <Collapsible defaultOpen className="px-2">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-8 px-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              Quick Actions
              <ChevronRight className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-8 px-2 pl-4 text-sm font-normal text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-4 mx-2" />

        {/* Bottom Actions */}
        <div className="space-y-1 px-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-8 px-2 text-sm font-normal text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;