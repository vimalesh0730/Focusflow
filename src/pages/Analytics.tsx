import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { useSessions } from "@/hooks/useSessions";
import { addDays, dayLabel, isoOfTimestamp, mondayOf, todayISO } from "@/lib/dates";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {empty ? (
          <div className="grid h-64 place-items-center text-sm text-slate-500">Complete a task or session to see this chart.</div>
        ) : (
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer></div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const t = useTasks();
  const sub = useSubjects();
  const s = useSessions();

  if (t.loading || sub.loading || s.loading) {
    return <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}</div>;
  }

  const today = todayISO();
  const doneCount = t.tasks.filter((x) => x.status === "completed").length;
  const statusData = [
    { name: "Completed", value: doneCount },
    { name: "Pending", value: t.tasks.length - doneCount },
  ];

  const groups = [...sub.subjects.map((x) => ({ id: x.id as string | null, name: x.name })), { id: null, name: "No subject" }];
  const subjectData = groups
    .map((g) => {
      const list = t.tasks.filter((x) => x.subject_id === g.id);
      const d = list.filter((x) => x.status === "completed").length;
      return { name: g.name, total: list.length, pct: list.length ? Math.round((d / list.length) * 100) : 0 };
    })
    .filter((g) => g.total > 0);

  const hoursData = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i - 13);
    const mins = s.sessions.filter((x) => x.completed && x.session_date === d).reduce((a, x) => a + x.minutes, 0);
    return { name: dayLabel(d).split(" ").slice(1).join(" "), hours: Math.round((mins / 60) * 10) / 10 };
  });

  const weeklyData = Array.from({ length: 6 }, (_, i) => {
    const start = addDays(mondayOf(today), -7 * (5 - i));
    const end = addDays(start, 6);
    const n = t.tasks.filter((x) => {
      if (!x.completed_at) return false;
      const d = isoOfTimestamp(x.completed_at);
      return d >= start && d <= end;
    }).length;
    return { name: dayLabel(start).split(" ").slice(1).join(" "), tasks: n };
  });

  const error = t.error || sub.error || s.error;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Error: {error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Completed vs pending tasks" empty={t.tasks.length === 0}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} label>
              <Cell fill="#4f46e5" /><Cell fill="#cbd5e1" />
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ChartCard>

        <ChartCard title="Subject-wise completion (%)" empty={subjectData.length === 0}>
          <BarChart data={subjectData}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} />
            <Tooltip /><Bar dataKey="pct" name="Completed %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Study hours, last 14 days" empty={hoursData.every((x) => x.hours === 0)}>
          <BarChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={1} /><YAxis allowDecimals />
            <Tooltip /><Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Weekly productivity (tasks completed)" empty={weeklyData.every((x) => x.tasks === 0)}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} />
            <Tooltip /><Line type="monotone" dataKey="tasks" name="Tasks" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}