"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// --- GRAPHIQUE 1 : ÉVOLUTION (COURBE) ---
export function RegistrationsLineChart({ data }: { data: any[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#64748b" }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#64748b" }} 
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            itemStyle={{ color: "#0f172a", fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="inscrits"
            name="Inscriptions"
            stroke="#0d9488" // teal-600
            strokeWidth={3}
            dot={{ r: 4, fill: "#0d9488", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#0d9488", stroke: "#ccfbf1", strokeWidth: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- GRAPHIQUE 2 : RÉPARTITION (DONUT) ---
const PIE_COLORS = {
  STANDARD: "#0d9488", // teal-600
  STUDENT: "#3b82f6",  // blue-500
  VIP: "#8b5cf6",      // purple-500
  SPEAKER: "#f59e0b",  // amber-500
  ORGANIZER: "#94a3b8",// slate-400
};

export function ProfilesPieChart({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || "#cbd5e1"} 
              />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span 
              className="h-2.5 w-2.5 rounded-full" 
              style={{ backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || "#cbd5e1" }}
            />
            {entry.name.toLowerCase()} ({entry.value})
          </div>
        ))}
      </div>
    </div>
  );
}

// --- GRAPHIQUE 3 : ENTONNOIR D'ÉVALUATION (BARRES HORIZONTALES) ---
export function FunnelBarChart({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }} 
          />
          <Tooltip 
             cursor={{ fill: "#f8fafc" }}
             contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          />
          <Bar dataKey="value" name="Articles" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}