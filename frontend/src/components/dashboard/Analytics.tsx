import { Card } from "@/components/ui/card";
import { Patient, Resources } from "@/pages/Dashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsProps {
  patients: Patient[];
  resources: Resources;
}

const Analytics = ({ patients, resources }: AnalyticsProps) => {
  const admittedCount = patients.filter((p) => p.status === "Admitted").length;
  const waitingCount = patients.filter((p) => p.status === "Waiting").length;

  const patientStatusData = [
    { name: "Admitted", value: admittedCount, color: "hsl(var(--success))" },
    { name: "Waiting", value: waitingCount, color: "hsl(var(--warning))" },
  ];

  const resourceUtilizationData = Object.entries(resources).map(([key, resource]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    utilized: resource.total - resource.available,
    available: resource.available,
  }));

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Summary Cards */}
      <div className="space-y-4">
        <Card className="p-6 rounded-2xl border shadow-elegant">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Patients</h3>
          <p className="text-4xl font-semibold text-foreground">{patients.length}</p>
        </Card>

        <Card className="p-6 rounded-2xl border shadow-elegant">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Patient Status</h3>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground">Admitted</span>
              <span className="text-lg font-semibold text-success">{admittedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground">Waiting</span>
              <span className="text-lg font-semibold text-warning">{waitingCount}</span>
            </div>
          </div>
        </Card>

        {patientStatusData.some(d => d.value > 0) && (
          <Card className="p-6 rounded-2xl border shadow-elegant">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Patient Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={patientStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Resource Utilization Chart */}
      <Card className="p-6 rounded-2xl border shadow-elegant">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Resource Utilization</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={resourceUtilizationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
              }}
            />
            <Bar dataKey="utilized" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 8, 8]} />
            <Bar dataKey="available" stackId="a" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Utilized</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
