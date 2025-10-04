import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Patient } from "@/utils/api";

interface AddPatientFormProps {
  onAddPatient: (patient: Omit<Patient, "id" | "status">) => Promise<boolean> | boolean;
  resources: {
    wards: Record<string, { available: number }>;
    doctors: string[];
  };
}

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const SEVERITY_LEVELS = [
  { value: '1', label: '1 - Stable' },
  { value: '2', label: '2 - Mild' },
  { value: '3', label: '3 - Moderate' },
  { value: '4', label: '4 - Severe' },
  { value: '5', label: '5 - Critical' },
];

const AddPatientForm = ({ onAddPatient, resources }: AddPatientFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    contact: "",
    emergencyContact: "",
    diagnosis: "",
    assignedDoctor: "",
    ward: "",
    bedNumber: "",
    isICU: false,
    needsVentilator: false,
    needsOxygen: false,
    severity: "3",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.contact) {
      toast.error("Please fill in all required fields");
      return;
    }

    const success = await Promise.resolve(onAddPatient({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as Patient['gender'],
      contact: formData.contact,
      emergencyContact: formData.emergencyContact,
      admissionDateTime: new Date().toISOString(),
      diagnosis: formData.diagnosis,
      assignedDoctor: formData.assignedDoctor,
      bedNumber: formData.bedNumber,
      ward: formData.ward,
      isICU: formData.isICU,
      needsVentilator: formData.needsVentilator,
      needsOxygen: formData.needsOxygen,
      severity: parseInt(formData.severity),
      notes: formData.notes,
    }));

    if (success) {
      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "Male",
        contact: "",
        emergencyContact: "",
        diagnosis: "",
        assignedDoctor: "",
        ward: "",
        bedNumber: "",
        isICU: false,
        needsVentilator: false,
        needsOxygen: false,
        severity: "3",
        notes: "",
      });
    }
  };

  const wardOptions = Object.entries(resources.wards || {}).map(([ward, data]) => ({
    value: ward,
    label: `${ward}`,
    disabled: data.available <= 0,
  }));

  const doctorOptions = resources.doctors?.map(doctor => ({
    value: doctor,
    label: doctor,
  })) || [];

  return (
    <Card className="p-6 rounded-2xl border shadow-elegant overflow-y-auto max-h-[80vh]">
      <h2 className="text-xl font-semibold mb-6">New Patient Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground/80">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter patient's full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Age <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="age"
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
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium">
                Contact Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact" className="text-sm font-medium">
                Emergency Contact
              </Label>
              <Input
                id="emergencyContact"
                type="tel"
                placeholder="+91 91234 56789"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground/80">Medical Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="diagnosis" className="text-sm font-medium">
                Diagnosis / Condition
              </Label>
              <Input
                id="diagnosis"
                type="text"
                placeholder="Primary diagnosis or condition"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity" className="text-sm font-medium">
                Severity Level
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select severity level" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Special Requirements</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isICU" 
                    checked={formData.isICU}
                    onCheckedChange={(checked) => setFormData({ ...formData, isICU: checked as boolean })}
                  />
                  <Label htmlFor="isICU" className="text-sm font-normal">ICU Required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="needsVentilator" 
                    checked={formData.needsVentilator}
                    onCheckedChange={(checked) => setFormData({ ...formData, needsVentilator: checked as boolean })}
                  />
                  <Label htmlFor="needsVentilator" className="text-sm font-normal">Ventilator</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="needsOxygen" 
                    checked={formData.needsOxygen}
                    onCheckedChange={(checked) => setFormData({ ...formData, needsOxygen: checked as boolean })}
                  />
                  <Label htmlFor="needsOxygen" className="text-sm font-normal">Oxygen Support</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Details */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="font-medium text-foreground/80">Admission Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-medium">
                  Ward/Unit
                </Label>
                <Select
                  value={formData.ward}
                  onValueChange={(value) => setFormData({ ...formData, ward: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select ward/unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {wardOptions.map((ward) => (
                      <SelectItem 
                        key={ward.value} 
                        value={ward.value}
                        disabled={ward.disabled}
                      >
                        {ward.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedNumber" className="text-sm font-medium">
                  Bed Number
                </Label>
                <Input
                  id="bedNumber"
                  type="text"
                  placeholder="e.g., A101"
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedDoctor" className="text-sm font-medium">
                  Assigned Doctor
                </Label>
                <Select
                  value={formData.assignedDoctor}
                  onValueChange={(value) => setFormData({ ...formData, assignedDoctor: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorOptions.map((doctor) => (
                      <SelectItem key={doctor.value} value={doctor.value}>
                        {doctor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional information or special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[100px] rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            className="h-11 rounded-xl"
            onClick={() => {
              // Reset form
              setFormData({
                name: "",
                age: "",
                gender: "Male",
                contact: "",
                emergencyContact: "",
                diagnosis: "",
                assignedDoctor: "",
                ward: "",
                bedNumber: "",
                isICU: false,
                needsVentilator: false,
                needsOxygen: false,
                severity: "3",
                notes: "",
              });
            }}
          >
            Clear Form
          </Button>
          <Button 
            type="submit" 
            className="h-11 rounded-xl font-medium px-6"
          >
            Admit Patient
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddPatientForm;
