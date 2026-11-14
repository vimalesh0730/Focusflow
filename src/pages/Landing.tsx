import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CalendarClock, CalendarDays, Gauge, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Gauge, title: "A priority score you can read", text: "Each task gets a 1–10 score from deadline urgency, importance and difficulty. A plain formula, not a black box." },
  { icon: CalendarClock, title: "A plan built around your hours", text: "Sessions are placed highest priority first, inside the hours you really have. Whatever doesn't fit is flagged, not hidden." },
  { icon: Timer, title: "Focus clock", text: "A Pomodoro timer tied to your tasks. Every finished block is saved to your study log." },
  { icon: CalendarDays, title: "Smart calendar", text: "Deadlines and planned sessions per day, with a workload tint that shows overloaded days at a glance." },
  { icon: BarChart3, title: "Honest analytics", text: "Completion by subject, study hours and weekly output, drawn from what you actually finished." },
  { icon: ShieldCheck, title: "Your data stays yours", text: "Every record is tied to your account and locked down with row-level security." },
];
const steps = [
  { n: "01", title: "Add what's on your plate", text: "Subjects first, then each assignment with a due date, an estimate, and how important and hard it is." },
  { n: "02", title: "Tell it your hours", text: "Set how long you can study each weekday and the longest block you'll sit through." },
  { n: "03", title: "Follow the plan", text: "Get a day-by-day schedule, run focus blocks against your tasks, and watch the week add up." },
];

export default function Landing() {
  const { session } = useAuth();
  const cta = session ? { to: "/app", label: "Open workspace" } : { to: "/login", label: "Create your workspace" };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#06060a] text-zinc-100">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] opacity-40"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff0d 1px, transparent 1px), linear-gradient(to bottom, #ffffff0d 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 70%)",
        }} />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-12rem] h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <header  className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
  <Link to="/"><Logo /></Link>
  <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
    <a href="#features" className="hover:text-white">Features</a>
    <a href="#how" className="hover:text-white">How it works</a>
    <a href="#formula" className="hover:text-white">The formula</a>
  </nav>
  <div className="flex items-center gap-3 text-sm">
    {!session && <Link to="/login" className="text-zinc-300 hover:text-white">Log in</Link>}
    <Link to={cta.to} className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:opacity-90">
      {session ? "Open workspace" : "Get started"}
    </Link>
  </div>
</header>
      

      <main className="relative">
        <section className="mx-auto max-w-4xl px-5 pb-10 pt-16 text-center md:pt-24">
          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            A study planner for people with too much to do
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Your semester, <span className="text-primary">planned</span> and protected.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            Turn deadlines, subjects and the hours you actually have into a clear daily plan, then stay on it with a built-in focus clock.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={cta.to} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white hover:opacity-90">
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-zinc-200 hover:bg-white/10">
              See how it works
            </a>
          </div>
        </section>

        <section aria-hidden className="mx-auto max-w-3xl px-5 pb-20">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-primary/10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-white/15" /><i className="h-2.5 w-2.5 rounded-full bg-white/15" /><i className="h-2.5 w-2.5 rounded-full bg-white/15" /></div>
              <span className="text-xs text-zinc-500">Preview</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="space-y-2 sm:col-span-3">
                <div className="text-xs uppercase tracking-wide text-zinc-500">Today's plan</div>
                {[["Problem set 4", "60 min", "8.6"], ["Lab report draft", "45 min", "7.1"], ["Read chapter 7", "30 min", "4.3"]].map(([t, m, p]) => (
                  <div key={t} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
                    <span>{t}</span>
                    <span className="flex items-center gap-3 text-zinc-500">{m}<b className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-violet-300">{p}</b></span>
                  </div>
                ))}
              </div>
              <div className="grid place-items-center rounded-xl border border-white/10 bg-black/30 p-4 sm:col-span-2">
                <div className="font-mono text-4xl tabular-nums">24:12</div>
                <div className="mt-1 text-xs text-zinc-500">Focus block</div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 rounded-full bg-primary" /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-semibold">Everything a busy student needs, nothing they don't</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-violet-300"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-semibold">Three steps to a calmer week</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 p-6">
                <div className="font-mono text-sm text-primary">{s.n}</div>
                <h3 className="mt-3 font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="formula" className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-3xl font-semibold">No black box</h2>
          <p className="mt-3 text-zinc-400">Priorities come from a simple rule-based heuristic. It isn't AI or machine learning, and you can check the maths yourself.</p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <code className="text-sm text-violet-300 sm:text-base">Priority = 0.5 × urgency + 0.3 × importance + 0.2 × difficulty</code>
            <p className="mt-3 text-xs text-zinc-500">Each part is scaled 1–10. Overdue or due-today tasks score 10 for urgency.</p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-24 text-center">
          <h2 className="text-3xl font-semibold">Ready to plan your week?</h2>
          <Link to={cta.to} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white hover:opacity-90">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="relative border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        FocusFlow · Built with React and Supabase
      </footer>
    </div>
  );
}