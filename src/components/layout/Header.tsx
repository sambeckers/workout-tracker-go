import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, User, Settings, Calendar, TrendingUp, Book } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Calendar, label: "Schedule", path: "/schedule" },
    { icon: Book, label: "Exercises", path: "/exercises" },
    { icon: TrendingUp, label: "Progress", path: "/progress" },
  ];

  return (
    <header className="bg-gradient-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-md group-hover:shadow-glow transition-smooth">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Go // Workout Tracker
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;