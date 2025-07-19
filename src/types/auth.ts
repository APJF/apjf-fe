export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  enabled?: boolean;
  authorities?: string[];
}
