import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTheme as useCustomTheme, colorPalettes, fontFamilies } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, Moon, Sun, Bell, Shield, Palette, Save, Upload, LogOut, Type, Eye, EyeOff, Lock, Download, Weight } from "lucide-react";
import { useUnitPreference } from '@/contexts/UnitPreferenceContext';

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currentPalette, currentFont, setPalette, setFont } = useCustomTheme();
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    profileImage: ""
  });
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { unit, toggleUnit, setUnit } = useUnitPreference();

  // Mock user for development
  const mockUser = {
    user_metadata: { 
      name: "Sam Beckers", 
      avatar_url: "", 
      bio: "Fitness enthusiast and developer" 
    },
    email: "sam@example.com"
  };
  
  const displayUser = user || mockUser;

  useEffect(() => {
    setProfile({
      name: displayUser.user_metadata?.name || "",
      username: (displayUser.user_metadata as any)?.username || "",
      email: displayUser.email || "",
      bio: displayUser.user_metadata?.bio || "",
      profileImage: displayUser.user_metadata?.avatar_url || ""
    });
  }, [displayUser]);



  const handleProfileSave = async () => {
    setLoading(true);
    
    // If user is authenticated, save to Supabase
    if (user && updateProfile) {
      const { error } = await updateProfile({
        name: profile.name,
        username: profile.username,
        avatar_url: profile.profileImage,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    // Show success message (works for both authenticated and development mode)
    toast({
      title: "Profile Updated",
      description: user ? "Your profile settings have been saved successfully." : "Profile changes saved (development mode).",
    });
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    if (user && signOut) {
      await signOut();
      navigate("/login");
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } else {
      // Development mode - just show a message
      toast({
        title: "Sign out (Development Mode)",
        description: "Authentication is bypassed for development.",
      });
    }
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => ({
          ...prev,
          profileImage: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);

    if (user && changePassword) {
      const { error } = await changePassword(passwordData.newPassword);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } else {
      toast({
        title: "Password Change (Development Mode)",
        description: "Password changes are bypassed in development mode.",
      });
    }

    setPasswordLoading(false);
  };

  const handleExportData = () => {
    // Mock workout data - in a real app, this would come from your database
    const mockWorkoutData = {
      user: {
        name: displayUser.user_metadata?.name || "User",
        email: displayUser.email,
        joinDate: "2024-01-01"
      },
      workouts: [
        {
          id: 1,
          date: "2024-09-10",
          name: "Upper Body Strength",
          exercises: [
            { name: "Push-ups", sets: 3, reps: 15 },
            { name: "Pull-ups", sets: 3, reps: 8 }
          ],
          duration: 45
        },
        {
          id: 2,
          date: "2024-09-12",
          name: "Cardio Session",
          exercises: [
            { name: "Running", duration: 30, distance: "5km" },
            { name: "Cycling", duration: 15, distance: "10km" }
          ],
          duration: 45
        }
      ],
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(mockWorkoutData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your workout data has been downloaded as a JSON file.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profileImage} />
              <AvatarFallback className="text-lg">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Change Avatar
                  </span>
                </Button>
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Choose a unique username"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
            />
          </div>

          <Button onClick={handleProfileSave} className="w-full sm:w-auto" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Unit Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
            Measurement Units
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Preferred Weight Unit</p>
              <p className="text-sm text-muted-foreground">Applies across planning and session tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${unit === 'kg' ? 'font-semibold' : 'text-muted-foreground'}`}>kg</span>
              <Switch checked={unit === 'lbs'} onCheckedChange={toggleUnit} />
              <span className={`text-xs ${unit === 'lbs' ? 'font-semibold' : 'text-muted-foreground'}`}>lbs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Theme Preference</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme or follow system setting
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          <Separator />

          {/* Color Palette Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Color Palette</Label>
              <p className="text-sm text-muted-foreground">
                Choose from popular modern website color schemes
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(colorPalettes).map(([key, palette]) => (
                <Button
                  key={key}
                  variant={currentPalette === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPalette(key)}
                  className="flex flex-col items-start p-4 h-auto min-h-[96px] text-left relative overflow-hidden rounded-md gap-1"
                >
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{ background: palette.colors.gradientHero }}
                  />
                  <div className="relative z-10 w-full flex flex-col">
                    <div className="font-medium text-sm leading-tight break-words line-clamp-[3]">{palette.name}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5 break-words">
                      {palette.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Font Family Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Typography</Label>
              <p className="text-sm text-muted-foreground">
                Choose from different font categories for your preferred reading experience
              </p>
            </div>
            
            {/* Group fonts by category */}
            {(['Sans-Serif', 'Serif', 'Monospace', 'Display', 'System'] as const).map(category => {
              const fontsInCategory = Object.entries(fontFamilies).filter(([_, font]) => font.category === category);
              
              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fontsInCategory.map(([key, font]) => (
                      <Button
                        key={key}
                        variant={currentFont === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFont(key)}
                        className="flex items-start justify-start gap-2 p-3 h-auto min-h-[80px] text-left rounded-md"
                        style={{ fontFamily: font.css }}
                      >
                        <Type className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <div className="font-medium text-sm leading-tight break-words">{font.name}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug break-words">
                            {font.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for workout reminders and achievements
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter your current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePasswordChange} 
              className="w-full" 
              disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              <Lock className="h-4 w-4 mr-2" />
              {passwordLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button variant="destructive" className="w-full justify-start" disabled>
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">
              Account deletion feature coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
