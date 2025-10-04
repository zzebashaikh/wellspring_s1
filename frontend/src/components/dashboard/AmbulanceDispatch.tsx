import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Ambulance } from "lucide-react";
import { Patient } from "@/pages/Dashboard";

interface AmbulanceDispatchProps {
  onDispatch: (patientData: Omit<Patient, "id" | "status"> & { pickupAddress: string }) => boolean;
  available: number;
}

const AmbulanceDispatch = ({ onDispatch, available }: AmbulanceDispatchProps) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    contact: "",
    severity: "3",
    pickupAddress: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.age || !formData.contact || !formData.pickupAddress) {
      return;
    }

    const success = onDispatch({
      name: formData.name,
      age: parseInt(formData.age),
      contact: formData.contact,
      severity: parseInt(formData.severity),
      pickupAddress: formData.pickupAddress,
    });

    if (success) {
      setFormData({
        name: "",
        age: "",
        contact: "",
        severity: "3",
        pickupAddress: "",
      });
    }
  };

  return (
    <Card className="p-6 rounded-2xl border shadow-elegant">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
          <Ambulance className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Emergency Dispatch</h3>
          <p className="text-sm text-muted-foreground">{available} ambulances available</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dispatch-name" className="text-sm font-medium">
              Patient Name
            </Label>
            <Input
              id="dispatch-name"
              type="text"
              placeholder="Enter patient name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispatch-age" className="text-sm font-medium">
              Age
            </Label>
            <Input
              id="dispatch-age"
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="h-11 rounded-xl"
              min="0"
              max="150"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispatch-contact" className="text-sm font-medium">
              Contact
            </Label>
            <Input
              id="dispatch-contact"
              type="tel"
              placeholder="Contact number"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="h-11 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispatch-severity" className="text-sm font-medium">
              Severity Level
            </Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Stable</SelectItem>
                <SelectItem value="2">2 - Mild</SelectItem>
                <SelectItem value="3">3 - Moderate</SelectItem>
                <SelectItem value="4">4 - Severe</SelectItem>
                <SelectItem value="5">5 - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup-address" className="text-sm font-medium">
            Pickup Address
          </Label>
          <Textarea
            id="pickup-address"
            placeholder="Enter complete pickup address"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            className="rounded-xl resize-none"
            rows={3}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={available === 0}
          className="w-full h-11 rounded-xl font-medium"
        >
          {available === 0 ? "No Ambulances Available" : "Dispatch Ambulance"}
        </Button>
      </form>
    </Card>
  );
};

export default AmbulanceDispatch;
