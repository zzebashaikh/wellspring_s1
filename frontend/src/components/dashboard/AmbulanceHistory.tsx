import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ambulance, Clock, MapPin, Phone, User } from "lucide-react";
import { ambulanceAPI } from "@/utils/api";
import { AmbulanceDispatch } from "@/types";
import { toast } from "sonner";
import { subscribeAmbulanceDispatches } from "@/firebase/firestore";

interface AmbulanceHistoryProps {
  refreshTrigger?: number;
}

const AmbulanceHistory = ({ refreshTrigger }: AmbulanceHistoryProps) => {
  const [dispatches, setDispatches] = useState<AmbulanceDispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadDispatches = async () => {
    try {
      setIsLoading(true);
      const dispatchData = await ambulanceAPI.getDispatches(20);
      setDispatches(dispatchData);
    } catch (error) {
      console.error('Error loading dispatches:', error);
      toast.error('Failed to load ambulance dispatch history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load initial data via API first - this ensures we always have data
    loadDispatches();
    
    // Start real-time subscription for live updates
    const unsubscribe = subscribeAmbulanceDispatches(20, (live) => {
      if (live.length > 0) {
        setDispatches(live);
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [refreshTrigger]);

  const markReachedHospital = async (dispatchId: string) => {
    try {
      setUpdatingId(dispatchId);
      console.log('Marking dispatch as reached hospital:', dispatchId);
      await ambulanceAPI.updateDispatchStatus(dispatchId, 'Available');
      console.log('Dispatch status updated successfully');
      toast.success('Marked as reached hospital. Ambulance is now available.');
      // The real-time listener will automatically update the UI
    } catch (error) {
      console.error('Failed to update dispatch status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update dispatch status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'En Route':
        return 'bg-yellow-100 text-yellow-800';
      case 'Busy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 5:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      // Handle regular Date
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      // Handle ISO string
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString();
      }
      return 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 rounded-2xl border shadow-elegant">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Ambulance className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Dispatches</h3>
            <p className="text-sm text-muted-foreground">Loading dispatch history...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl border shadow-elegant">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Ambulance className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Dispatches</h3>
            <p className="text-sm text-muted-foreground">{dispatches.length} recent dispatches</p>
          </div>
        </div>
        <Button
          onClick={loadDispatches}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {dispatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ambulance className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No ambulance dispatches yet</p>
          </div>
        ) : (
          dispatches.map((dispatch) => (
            <div
              key={dispatch.id}
              className="p-4 border rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{dispatch.patientName}</span>
                  <Badge className={`text-xs ${getSeverityColor(dispatch.severityLevel)}`}>
                    Level {dispatch.severityLevel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(dispatch.ambulanceStatus)}`}>
                    {dispatch.ambulanceStatus}
                  </Badge>
                  {(dispatch.ambulanceStatus === 'En Route' || dispatch.ambulanceStatus === 'Busy') && (
                    <Button
                      size="sm"
                      className="rounded-xl"
                      onClick={() => markReachedHospital(dispatch.id!)}
                      disabled={!!updatingId}
                    >
                      {updatingId === dispatch.id ? 'Updating...' : 'Reached Hospital'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Age: {dispatch.age}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{dispatch.contactNumber}</span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{dispatch.pickupAddress}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Ambulance: {dispatch.assignedAmbulanceID || 'Not assigned'}</span>
                  <span>Dispatched: {formatTimestamp(dispatch.dispatchTime)}</span>
                </div>
                {/* Duplicate action at footer for small screens if needed */}
                {(dispatch.ambulanceStatus === 'En Route' || dispatch.ambulanceStatus === 'Busy') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl md:hidden"
                    onClick={() => markReachedHospital(dispatch.id!)}
                    disabled={!!updatingId}
                  >
                    {updatingId === dispatch.id ? 'Updating...' : 'Reached Hospital'}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default AmbulanceHistory;
