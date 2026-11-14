export interface Profile {
  id: string;
  full_name: string | null;
  daily_hours: Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", number>;
  max_session_min: number;
}
export interface Subject {
  id: string;
  name: string;
  code: string | null;
  difficulty: number;
  progress: number;
  created_at: string;
}
export interface Task {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  estimated_min: number;
  importance: number;
  difficulty: number;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  created_at: string;
}
export interface StudySession {
  id: string;
  task_id: string;
  session_date: string;
  minutes: number;
  completed: boolean;
}