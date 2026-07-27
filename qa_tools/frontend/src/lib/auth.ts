export const AUTH_TOKEN_KEY = "access_token";
export const AUTH_USER_KEY = "auth_user";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
