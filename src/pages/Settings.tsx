import { useEffect, useState } from "react";
import { z } from "zod";
import { useProfile, DEFAULT_HOURS } from "@/hooks/useProfile";
import type { Weekday } from "@/lib/scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Monday" }, { key: "tue", label: "Tuesday" }, { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" }, { key: "fri", label: "Friday" }, { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const schema = z.object({
  full_name: z.string().trim().max(80, "Name: max 80 characters"),
  hours: z.array(z.number().min(0, "Hours must be 0–16").max(16, "Hours must be 0–16")),
  max_session_min: z.number().int().min(15, "Session length must be 15–240").max(240, "Session length must be 15–240"),
});

export default function Settings() {
  const { profile, loading, error, save } = useProfile();
  const [name, setName] = useState("");
  const [hours, setHours] = useState<Record<Weekday, string>>({ mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" });
  const [maxMin, setMaxMin] = useState("90");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = profile;
    if (!p) return;
    setName(p.full_name ?? "");
    setMaxMin(String(p.max_session_min));
    const h = p.daily_hours ?? DEFAULT_HOURS;
    setHours({ mon: String(h.mon), tue: String(h.tue), wed: String(h.wed), thu: String(h.thu), fri: String(h.fri), sat: String(h.sat), sun: String(h.sun) });
  }, [profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setErr("");
    const parsed = schema.safeParse({
      full_name: name, hours: DAYS.map((d) => Number(hours[d.key])), max_session_min: Number(maxMin),
    });
    if (!parsed.success) return setErr(parsed.error.issues[0].message);
    if (DAYS.some((d) => hours[d.key].trim() === "")) return setErr("Enter hours for every day (0 if none)");
    const daily = Object.fromEntries(DAYS.map((d, i) => [d.key, parsed.data.hours[i]])) as Record<Weekday, number>;
    setBusy(true);
    const result = await save({ full_name: parsed.data.full_name || null, daily_hours: daily, max_session_min: parsed.data.max_session_min });
    setBusy(false);
    if (result) setErr(result); else setMsg("Settings saved.");
  }

  if (loading) return <Skeleton className="h-96 max-w-xl rounded-xl" />;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load profile: {error}</p>}
      <form onSubmit={submit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <Label htmlFor="nm">Full name</Label>
            <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Daily study availability (hours)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {DAYS.map((d) => (
              <div key={d.key} className="space-y-1">
                <Label htmlFor={d.key}>{d.label}</Label>
                <Input id={d.key} type="number" step="0.5" value={hours[d.key]} onChange={(e) => setHours({ ...hours, [d.key]: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <Label htmlFor="mx">Longest single study session (minutes)</Label>
            <Input id="mx" type="number" value={maxMin} onChange={(e) => setMaxMin(e.target.value)} />
          </CardContent>
        </Card>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
      </form>
    </div>
  );
}