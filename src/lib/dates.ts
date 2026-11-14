const pad = (n: number) => String(n).padStart(2, "0");
const parse = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const addDays = (iso: string, n: number) => { const d = parse(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const mondayOf = (iso: string) => addDays(iso, -((parse(iso).getDay() + 6) % 7));
export const dayLabel = (iso: string) =>
  parse(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
export const isoOfTimestamp = (ts: string) => toISO(new Date(ts));