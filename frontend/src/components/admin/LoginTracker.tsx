// components/admin/LoginTracker.tsx
import { useState, useEffect } from "react";
import { authAPI } from "@/utils/api";
import { ReceptionistLogin } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, User } from "lucide-react";

interface LoginTrackerProps {
  receptionistUid?: string; // Optional: show logs for specific receptionist
}

export default function LoginTracker({ receptionistUid }: LoginTrackerProps) {
  const [logins, setLogins] = useState<ReceptionistLogin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let loginData: ReceptionistLogin[];
      
      if (receptionistUid) {
        // Fetch logs for specific receptionist
        loginData = await authAPI.getReceptionistLogins(receptionistUid, 20);
      } else {
        // Fetch recent logs for all receptionists
        loginData = await authAPI.getRecentLogins(50);
      }
      
      setLogins(loginData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch login data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, [receptionistUid]);

  const formatLoginTime = (login: ReceptionistLogin) => {
    if (login.loginTimeLocal) {
      return new Date(login.loginTimeLocal).toLocaleString();
    }
    return "Unknown time";
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Receptionist Login History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogins}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading login history...</p>
          </div>
        ) : logins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No login records found
          </div>
        ) : (
          <div className="space-y-3">
            {logins.map((login) => (
              <div
                key={login.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{login.name}</p>
                    <p className="text-xs text-muted-foreground">{login.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatLoginTime(login)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          Showing {logins.length} login record{logins.length !== 1 ? 's' : ''}
          {receptionistUid ? ' for this receptionist' : ' across all receptionists'}
        </div>
      </CardContent>
    </Card>
  );
}
