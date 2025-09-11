import { Link, useLocation } from "react-router-dom";
import { Calendar, Target, TrendingUp, Book, Home, Dumbbell, Plus, Settings, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const location = useLocation();
  const { open } = useSidebar();
  const { toast } = useToast();

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

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings panel will be implemented soon.",
    });
  };

  return (
    <Sidebar className={open ? "w-64" : "w-14"}>
      <SidebarContent>
        {/* Header */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-primary rounded-md">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            {open && <span className="font-semibold text-sidebar-primary">FitTracker</span>}
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">SB</AvatarFallback>
          </Avatar>
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-primary truncate">Sam Beckers</p>
                <p className="text-xs text-sidebar-foreground truncate">Free Plan</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-sidebar-foreground" onClick={handleSettings}>
                <Settings className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className={cn(
                      "flex items-center gap-3",
                      isActivePath(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        {open && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((action) => (
                  <SidebarMenuItem key={action.path}>
                    <SidebarMenuButton asChild>
                      <Link to={action.path} className="flex items-center gap-3">
                        <action.icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        {open && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSettings}>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;