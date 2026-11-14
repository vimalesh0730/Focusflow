import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { isConfigured } from "@/lib/supabase";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import Tasks from "@/pages/Tasks";
import Schedule from "@/pages/Schedule";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Landing from "@/pages/Landing";
import Focus from "@/pages/Focus";
import Calendar from "@/pages/Calendar";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ padding: 16, color: "#f87171", whiteSpace: "pre-wrap" }}>
          Something went wrong:{"\n"}
          {this.state.error.message}
        </pre>
      );
    }
    return this.props.children;
  }
}

function SetupScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 560, fontFamily: "sans-serif" }}>
      <h1>Setup needed</h1>
      <p>
        Create a file named <b>.env.local</b> next to package.json containing:
      </p>
      <pre style={{ background: "#1b1b21", padding: 12 }}>
{`VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY`}
      </pre>
      <p>Then stop the server (Ctrl+C) and run <b>npm run dev</b> again.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {!isConfigured ? (
        <SetupScreen />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="focus" element={<Focus />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </ErrorBoundary>
  </StrictMode>
);