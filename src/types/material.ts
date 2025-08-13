export type MaterialType = 'KANJI' | 'GRAMMAR' | 'VOCAB' | 'LISTENING' | 'READING' | 'WRITING';

export interface Material {
  id: string;
  title: string;
  fileUrl: string;
  type: MaterialType;
  format: string;
  script: string;
  translation: string;
  unitId?: string;
}

// API Response for Materials
export interface MaterialsApiResponse {
  success: boolean;
  message: string;
  data: Material[];
  timestamp: number;
}
