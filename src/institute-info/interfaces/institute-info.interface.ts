export interface InstituteInfo {
  id: string; // UUID
  location: string;
  phone_numbers: string[];
  email: string;
  social_media: {
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
  };
  created_at: string;
  updated_at: string;
}

