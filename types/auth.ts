export type AppModule = "campus-events" | "marketing";

export type UserRole =
  | "super-admin"
  | "admin"
  | "staff"
  | "user";

export interface MockUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  module: AppModule;
  label: string;
}