import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Target, TrendingUp, Book, Home, Dumbbell, Plus, Settings, User, ChevronRight, Code, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
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
  const navigate = useNavigate();
  const { open } = useSidebar();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { isDevMode, toggleDevMode } = useDevMode();
  const { isAdminAuthenticated, adminLogout } = useAdminAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Mock user for development mode
  const mockUser = {
    user_metadata: { name: "Sam Beckers", avatar_url: "" },
    email: "sam@example.com"
  };
  
  // Determine which user to display based on admin auth, dev mode setting and authentication status
  const displayUser = (isAdminAuthenticated && isDevMode) ? mockUser : (user || mockUser);
  const isUsingRealUser = !isDevMode && user;
  const isUsingDevMode = isAdminAuthenticated && (isDevMode || !user);
  const showDevModeControls = isAdminAuthenticated;

  const mainNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Calendar, label: "Schedule", path: "/dashboard/schedule" },
    { icon: Book, label: "Exercises", path: "/dashboard/exercises" },
    { icon: Target, label: "Goals", path: "/dashboard/goals" },
    { icon: TrendingUp, label: "Progress", path: "/dashboard/progress" },
  ];

  const quickActions = [
    { icon: Plus, label: "New Workout", path: "/dashboard/workout/new" },
    { icon: Dumbbell, label: "Quick Session", path: "/dashboard/workout/quick" },
    { icon: Target, label: "Add Goal", path: "/dashboard/goals/new" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    return location.pathname.startsWith(path);
  };

  const handleSettings = () => {
    navigate("/dashboard/settings");
  };

  const handleDevModeToggle = () => {
    if (!isAdminAuthenticated) {
      // Non-admins cannot toggle dev mode
      return;
    }

    toggleDevMode();
    if (isDevMode) {
      // Switching from dev mode to user mode
      if (user) {
        toast({
          title: "Switched to User Account",
          description: `Now using your authenticated account: ${user.email}`,
        });
      } else {
        toast({
          title: "No User Account",
          description: "Please log in to use user account mode.",
          variant: "destructive",
        });
      }
    } else {
      // Switching from user mode to dev mode
      toast({
        title: "Switched to Dev Mode",
        description: "Now using development mode with mock data.",
      });
    }
  };

  return (
    <Sidebar className={open ? "w-64" : "w-14"}>
      <SidebarContent>
        {/* Header */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="p-1.5 bg-gradient-primary rounded-md">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            {open && <span className="font-semibold text-sidebar-primary">Workout Tracker</span>}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayUser?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {displayUser?.user_metadata?.name ? 
                displayUser.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                displayUser?.email?.charAt(0).toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-primary truncate">
                  {displayUser?.user_metadata?.name || displayUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground truncate">{displayUser?.email}</p>
              </div>
              <button 
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSettings();
                }}
                type="button"
              >
                <Settings className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Dev Mode Toggle - Only for Admin */}
        {open && showDevModeControls && (
          <div className="px-4 py-2 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isUsingDevMode ? (
                  <Code className="h-4 w-4 text-orange-500" />
                ) : (
                  <UserCheck className="h-4 w-4 text-green-500" />
                )}
                <span className="text-xs font-medium text-sidebar-foreground">
                  Mode: {isUsingDevMode ? "Development" : "User Account"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(!user && isDevMode && isAdminAuthenticated) ? () => navigate("/login") : handleDevModeToggle}
                className="h-6 px-2 text-xs"
              >
                {(!user && isDevMode && isAdminAuthenticated) ? "Login" : (isDevMode ? "Use Account" : "Dev Mode")}
              </Button>
            </div>
            {isUsingRealUser && (
              <p className="text-xs text-green-600 mt-1">✓ Authenticated as {user?.email}</p>
            )}
            {isDevMode && user && (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-orange-600">Dev mode active (real user available)</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleDevModeToggle();
                    toast({
                      title: "Switched to Your Account",
                      description: `Now using your authenticated account: ${user.email}`,
                    });
                  }}
                  className="h-6 w-full text-xs text-green-600 hover:text-green-700"
                >
                  Switch to Your Account
                </Button>
              </div>
            )}
            {!user && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">No authenticated user - dev mode only</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="h-7 w-full text-xs"
                >
                  Login as User
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Admin Login entry removed to keep UI clean for users */}

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
                  <Link
                    to="/dashboard/settings"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors",
                      isActivePath("/dashboard/settings") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuItem>
                {isAdminAuthenticated && (
                  <SidebarMenuItem>
                    <button
                      onClick={() => {
                        adminLogout();
                        toast({
                          title: "Admin Logout",
                          description: "You have been logged out of admin mode.",
                        });
                      }}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors text-orange-600 hover:text-orange-700"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Logout</span>
                    </button>
                  </SidebarMenuItem>
                )}
                {isUsingRealUser && (
                  <SidebarMenuItem>
                    <button
                      onClick={async () => {
                        await signOut();
                        navigate("/");
                        toast({
                          title: "Signed out",
                          description: "You have been successfully signed out.",
                        });
                      }}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors text-red-600 hover:text-red-700"
                    >
                      <User className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      {/* Admin modal removed; admin activation happens on Login page via username */}
    </Sidebar>
  );
};

export default AppSidebar;