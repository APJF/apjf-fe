import type { Exam } from './exam';
import type { Material } from './material';

export interface Unit {
  id: string;
  title: string;
  description: string | null;
  status: 'INACTIVE' | 'ACTIVE';
  chapterId?: string;
  prerequisiteUnitId: string | null;
  exams?: Exam[];
  materials?: Material[];
}

export interface UnitDetail extends Unit {
  chapterId?: string;
}

// Units API Response (for /api/units/chapter/{chapterId})
export interface UnitsApiResponse {
  success: boolean;
  message: string;
  data: Unit[];
  timestamp: number;
}

// Create Unit Request for staff
export interface CreateUnitRequest {
  title: string;
  description: string;
  status: 'INACTIVE' | 'ACTIVE';
  chapterId: string;
  prerequisiteUnitId: string | null;
  examIds: string[];
}

// Update Unit Request for staff
export interface UpdateUnitRequest {
  id: string;
  title: string;
  description: string;
  status: 'INACTIVE' | 'ACTIVE';
  chapterId: string;
  prerequisiteUnitId: string | null;
  examIds: string[];
}

// Create Unit API Response
export interface CreateUnitApiResponse {
  success: boolean;
  message: string;
  data: UnitDetail;
  timestamp: number;
}
