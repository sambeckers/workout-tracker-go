import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import CoverArea from "@/components/layout/CoverArea";
import Index from "./pages/Index";
import Schedule from "./pages/Schedule";
import Exercises from "./pages/Exercises";
import Goals from "./pages/Goals";
import Progress from "./pages/Progress";
import WorkoutSession from "./pages/WorkoutSession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <CoverArea />
            <main className="flex-1 bg-white">
              <div className="max-w-5xl mx-auto px-8 py-6">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/exercises" element={<Exercises />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/workout/:id" element={<WorkoutSession />} />
                  <Route path="/workout/new" element={<WorkoutSession />} />
                  <Route path="/workout/quick" element={<WorkoutSession />} />
                  <Route path="/goals/new" element={<Goals />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
