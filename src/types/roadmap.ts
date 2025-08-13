import type { Course } from "./course";

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  targetLevel: string; // "N5" | "N4" | "N3" | "N2" | "N1"
  primaryGoal: string;
  focusSkill: string;
  status: "PENDING" | "STUDYING" | "FINISHED";
  duration: number;
  userId: number;
  username: string;
  createdAt: string;
  lastUpdatedAt: string;
  courses: Course[];
}

export interface RoadmapModule {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  estimatedTime?: string;
  difficulty?: "Cơ bản" | "Trung bình" | "Nâng cao";
  status: "not_started" | "in_progress" | "completed" | "PENDING" | "STUDYING" | "FINISHED";
  skills?: string[];
  rating?: number;
  reviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoadmapStage {
  id: number;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "locked";
  progress: number;
  position: { x: number; y: number };
}

export interface RoadmapStats {
  totalModules: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
}
