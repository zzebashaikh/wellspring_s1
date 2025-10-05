import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Auto-log all outgoing requests to Render backend on page load
    window.addEventListener("load", () => {
      performance.getEntriesByType("resource")
        .filter(r => r.name.includes("wellspring-backend.onrender.com"))
        .forEach(r => console.log("Backend request:", r.name));
    });

    // Also log any future requests to Render backend
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      if (url.includes('wellspring-backend.onrender.com')) {
        console.log('Backend API call:', url);
      }
      return originalFetch.apply(this, args);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
