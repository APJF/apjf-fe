export type MaterialType = 'KANJI' | 'GRAMMAR' | 'VOCAB' | 'LISTENING' | 'READING' | 'WRITING';

export interface Material {
  id: string;
  fileUrl: string;
  type: MaterialType;
  description: string;
  script?: string;
  translation?: string;
  unitId?: string;
}
