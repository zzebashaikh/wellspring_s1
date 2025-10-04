import { Patient, Resources } from "@/pages/Dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface PatientQueueProps {
  patients: Patient[];
  onAllocate: (patientId: string, resourceType: keyof Resources) => void;
  resources: Resources;
}

const PatientQueue = ({ patients, onAllocate, resources }: PatientQueueProps) => {
  const [selectedResource, setSelectedResource] = useState<{ [key: string]: keyof Resources }>({});

  // Filter to only show patients with "Waiting" status and sort by priority (highest severity first)
  const waitingPatients = patients
    .filter(patient => patient.status === "Waiting")
    .sort((a, b) => b.severity - a.severity);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "bg-destructive text-destructive-foreground";
    if (severity >= 2) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 4) return "Critical";
    if (severity >= 2) return "Moderate";
    return "Stable";
  };

  return (
    <div className="space-y-4">
      {waitingPatients.length === 0 ? (
        <Card className="p-12 rounded-2xl border text-center">
          <p className="text-muted-foreground">No patients in queue</p>
        </Card>
      ) : (
        waitingPatients.map((patient) => (
          <Card key={patient.id} className="p-6 rounded-2xl border shadow-elegant transition-smooth hover:shadow-elegant-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                  <Badge className={`${getSeverityColor(patient.severity)} rounded-lg`}>
                    {getSeverityLabel(patient.severity)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Age: {patient.age} years</p>
                  <p>Contact: {patient.contact}</p>
                  <p>Severity Level: {patient.severity}/5</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Waiting</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Select
                value={selectedResource[patient.id]}
                onValueChange={(value) =>
                  setSelectedResource((prev) => ({ ...prev, [patient.id]: value as keyof Resources }))
                }
              >
                <SelectTrigger className="flex-1 rounded-xl">
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beds">Bed ({resources.beds.available} available)</SelectItem>
                  <SelectItem value="icus">ICU ({resources.icus.available} available)</SelectItem>
                  <SelectItem value="ventilators">Ventilator ({resources.ventilators.available} available)</SelectItem>
                  <SelectItem value="oxygen">Oxygen ({resources.oxygen.available} available)</SelectItem>
                  <SelectItem value="nurses">Nurse ({resources.nurses.available} available)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (selectedResource[patient.id]) {
                    onAllocate(patient.id, selectedResource[patient.id]);
                  }
                }}
                disabled={!selectedResource[patient.id]}
                className="rounded-xl"
              >
                Allocate
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default PatientQueue;
