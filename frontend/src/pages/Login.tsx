import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/utils/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("receptionist@wellspring.com");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated === "true") {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = await authAPI.login(email, password);
      if (token) {
        toast.success("Welcome to WellSpring Hospital");
        navigate("/dashboard");
      } else {
        toast.error("Login failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">WellSpring Hospital</h1>
          <p className="text-muted-foreground">Admin Portal</p>
        </div>

        <div className="bg-card rounded-3xl shadow-elegant-lg p-8 border border-border">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-medium transition-smooth"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p className="font-medium">WellSpring Hospital</p>
          <p className="mt-1">42 Horizon Avenue, Bandra-Kurla Complex</p>
          <p>Mumbai, Maharashtra 400051, India</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
