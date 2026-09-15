export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  private static TOKEN_KEY = 'stratax_auth_token';
  private static USER_KEY = 'stratax_auth_user';
  private static AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || 'http://localhost:3001';

  static async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; token?: string }> {
    try {
      const response = await fetch(`${this.AUTH_SERVER}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        // For dev: allow any credentials to pass through
        if (import.meta.env.DEV) {
          return { success: true, user: { email, name: 'Operator', role: 'operator' }, token: 'dev-token' };
        }
        return { success: false };
      }
      const data = await response.json();
      const user = data.user || { email, name: 'Operator', role: 'operator' };
      const token = data.session?.token || 'dev-token';
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch {
      if (import.meta.env.DEV) {
        return { success: true, user: { email, name: 'Operator', role: 'operator' }, token: 'dev-token' };
      }
      return { success: false };
    }
  }

  static async signUp(email: string, password: string): Promise<{ success: boolean; user?: AuthUser }> {
    try {
      const response = await fetch(`${this.AUTH_SERVER}/api/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        if (import.meta.env.DEV) {
          const user = { email, name: 'Operator', role: 'operator' };
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          return { success: true, user };
        }
        return { success: false };
      }
      return { success: true };
    } catch {
      if (import.meta.env.DEV) {
        const user = { email, name: 'Operator', role: 'operator' };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false };
    }
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY) || !!this.getCurrentUser();
  }

  static hasDevBypass(): boolean {
    return import.meta.env.DEV && localStorage.getItem('stratax_dev_bypass') === 'true';
  }

  static setDevBypass(val: boolean): void {
    localStorage.setItem('stratax_dev_bypass', val ? 'true' : 'false');
  }
}
