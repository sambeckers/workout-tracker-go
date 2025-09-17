import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeProvider } from "@/contexts/DevModeContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppSidebar from "@/components/layout/AppSidebar";
import CoverArea from "@/components/layout/CoverArea";
import DynamicSidebarTrigger from "@/components/layout/DynamicSidebarTrigger";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import PublicHome from "./pages/PublicHome";
import Schedule from "./pages/Schedule";
import Exercises from "./pages/Exercises";
import Goals from "./pages/Goals";
import Progress from "./pages/Progress";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import DynamicScrollLanding from "./pages/AppleScrollLanding";
import { UnitPreferenceProvider } from "@/contexts/UnitPreferenceContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CustomThemeProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <DevModeProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<PublicHome />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/landing/dynamic" element={<DynamicScrollLanding />} />
                  
                  {/* Main app routes - using real auth but fallback to dev mode if no user */}
                  <Route path="/dashboard/*" element={
                    <ProtectedRoute allowDevMode={true}>
                      <UnitPreferenceProvider>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full bg-background">
                            <DynamicSidebarTrigger />
                            <AppSidebar />
                            <div className="flex-1 flex flex-col">
                              <CoverArea />
                              <main className="flex-1 bg-white dark:bg-gray-900">
                                <div className="app-container py-8">
                                   <Routes>
                                     <Route path="/" element={<Index />} />
                                     <Route path="/schedule" element={<Schedule />} />
                                     <Route path="/exercises" element={<Exercises />} />
                                     <Route path="/goals" element={<Goals />} />
                                     <Route path="/progress" element={<Progress />} />
                                     <Route path="/workout/:id" element={<WorkoutSession />} />
                                     <Route path="/workout/new" element={<WorkoutSession />} />
                                     <Route path="/workout/quick" element={<WorkoutSession />} />
                                     <Route path="/workout/plan" element={<WorkoutPlanner />} />
                                     <Route path="/goals/new" element={<Goals />} />
                                     <Route path="/help" element={<Help />} />
                                     <Route path="/settings" element={<Settings />} />
                                     <Route path="*" element={<NotFound />} />
                                   </Routes>
                                </div>
                              </main>
                            </div>
                          </div>
                        </SidebarProvider>
                      </UnitPreferenceProvider>
                    </ProtectedRoute>
                  } />
                </Routes>
              </BrowserRouter>
              </TooltipProvider>
            </DevModeProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
