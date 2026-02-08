import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import ClassPage from "./pages/ClassPage";
import QuizPage from "./pages/QuizPage";
import QuestionsPage from "./pages/QuestionsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/class/:classId" element={<ClassPage />} />
            <Route path="/class/:classId/:tab" element={<ClassPage />} />
            <Route path="/class/:classId/quiz/:quizId" element={<QuizPage />} />
            <Route path="/class/:classId/questions/:questionSetId" element={<QuestionsPage />} />
            <Route path="/calendar" element={<Dashboard />} />
            <Route path="/todo" element={<Dashboard />} />
            <Route path="/archived" element={<Dashboard />} />
            <Route path="/settings" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
