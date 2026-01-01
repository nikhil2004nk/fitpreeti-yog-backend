export interface ContentSection {
  id: string; // UUID
  section_key: string;
  content: Record<string, any>; // Flexible JSON object
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

