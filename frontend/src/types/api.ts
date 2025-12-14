export type BaseEntity = {
  id: string;
  created_at: number;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type Meta = {
  page: number;
  total: number;
  totalPages: number;
};

export interface UserProfile {
  bio: string;
  profile_image: string;
  default_model: string;
  default_provider: string;
  default_aux_model: string;
  auto_generate_titles: boolean;
  title_generation_frequency: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  profile: UserProfile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  expires_at: number;
}

export type AuthResponse = {
  username: string;
  refresh: string;
  access: string;
};
