🕸️ FocusFlow – Intelligent Study Planner

A study planner that turns deadlines, subjects and your available hours into a daily plan, with a built-in focus clock.

**Live demo:** (https://focusflow-red-psi.vercel.app/)

## <i>Features</i>
- Dashboard with streak, today's plan and weekly progress
- Subjects and tasks with full create, edit, delete and complete
- Smart Schedule built around your daily study hours, with manual rescheduling
- Focus Clock (Pomodoro) that logs study time to your account
- Smart Calendar with a workload tint for overloaded days
- Analytics charts for completion, study hours and weekly output
  

## <i>Priority score</i>
Priority = 0.5 × urgency + 0.3 × importance + 0.2 × difficulty (each scaled 1–10).
This is a transparent rule-based heuristic, not AI or machine learning.


🧰 <i>Tech stack</i>
 | Tool | Role |
|---|---|
| *React 19* | User interface and reusable components |
| *TypeScript* | Type-safe application code |
| *Vite* | Development server and build tooling |
| *Tailwind CSS 4* | Responsive interface styling |
| *Supabase JS* | Client library for Supabase integration |
| *React Router* | Application navigation |
| *Recharts* | Charts and data visualisation |
| *Lucide React* | Interface icons |
| *React Hook Form + Zod* | Form handling and validation |



📁 <i>Project structure</i>
The repository currently follows a Vite + React + TypeScript application
layout:

Focusflow/
│
├── public/            # Static files and public assets
├── src/                 # Application source code
├── index.html           # Application entry HTML
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
└── vercel.json          # Vercel deployment configuration

🚀 <i>Run locally</i>
Prerequisites.
1. `npm install`
2. Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run `supabase/schema.sql` (and the `focus_logs` table) in the Supabase SQL editor
4. `npm run dev`



✦ <i>Contributing</i>
Good ideas make projects better. If you'd like to contribute:
1. Fork the repository.
2. Create a feature branch:
   git checkout -b feature/your-feature
3. Make your changes and test them.
4. Commit with a clear message:
   git commit -m "Add: describe your change"
5. Push your branch:
   git push origin feature/your-feature
6. Open a Pull Request explaining what changed and why.
For larger changes, open an issue first to discuss the idea.


✦ <i>The person behind the project</i>

<div align="center">Vimalesh V
 -- Student developer · Exploring AI, software engineering, and product building.--

  Built with curiosity. Shaped through iteration.

If FocusFlow resonates with you, consider giving the repository a ⭐.
</div>
