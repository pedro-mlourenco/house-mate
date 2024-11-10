export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface User {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  createdAt: Date;
}