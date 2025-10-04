import { Bed, Heart, Wind, Droplet, Users, Ambulance } from "lucide-react";
import { Resources } from "@/pages/Dashboard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResourceCardsProps {
  resources: Resources;
}

const ResourceCards = ({ resources }: ResourceCardsProps) => {
  const resourceConfig = [
    {
      key: "beds" as keyof Resources,
      label: "Beds",
      icon: Bed,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      key: "icus" as keyof Resources,
      label: "ICUs",
      icon: Heart,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      key: "ventilators" as keyof Resources,
      label: "Ventilators",
      icon: Wind,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      key: "oxygen" as keyof Resources,
      label: "Oxygen Supply",
      icon: Droplet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      key: "nurses" as keyof Resources,
      label: "Nurses",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      key: "ambulances" as keyof Resources,
      label: "Ambulances",
      icon: Ambulance,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resourceConfig.map(({ key, label, icon: Icon, color, bgColor }) => {
        const resource = resources[key];
        const utilization = ((resource.total - resource.available) / resource.total) * 100;

        return (
          <Card
            key={key}
            className="p-6 rounded-2xl border shadow-elegant transition-smooth hover:shadow-elegant-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-foreground">{resource.available}</p>
                <p className="text-sm text-muted-foreground">of {resource.total}</p>
              </div>
            </div>

            <h3 className="text-base font-medium text-foreground mb-3">{label}</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilization</span>
                <span className="font-medium text-foreground">{utilization.toFixed(1)}%</span>
              </div>
              <Progress value={utilization} className="h-2" />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ResourceCards;
