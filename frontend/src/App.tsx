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
    // Comprehensive request interception and logging for Render backend
    console.log('🔧 Setting up request interception for Render backend...');
    
    // Log existing requests on page load
    window.addEventListener("load", () => {
      const backendRequests = performance.getEntriesByType("resource")
        .filter(r => r.name.includes("wellspring-backend.onrender.com"));
      
      if (backendRequests.length > 0) {
        console.log('📡 Found existing backend requests:', backendRequests.map(r => r.name));
      } else {
        console.log('ℹ️ No existing backend requests found on page load');
      }
    });

    // Intercept all future requests to Render backend
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      const options = args[1] || {};
      
      if (url.includes('wellspring-backend.onrender.com')) {
        console.log('🌐 Backend API call intercepted:', {
          url,
          method: options.method || 'GET',
          timestamp: new Date().toISOString()
        });
        
        // Log response when it comes back
        return originalFetch.apply(this, args).then(response => {
          console.log('📥 Backend API response:', {
            url,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
          return response;
        }).catch(error => {
          console.error('❌ Backend API error:', {
            url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          throw error;
        });
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('✅ Request interception setup complete');
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
