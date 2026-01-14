import { Injectable } from '@angular/core';
import { UserProfile, SavedPlan } from '../models';

interface AuthUser {
  name: string;
  email: string;
  password: string; // In a real app, this should be hashed. Here we store simply for the demo.
  memberSince: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USERS_DB_KEY = 'totalfit_db_users'; // Always LocalStorage (Persistent DB)
  private readonly SESSION_KEY = 'totalfit_session';   // LocalStorage OR SessionStorage (Auth State)
  private readonly PLAN_PREFIX = 'totalfit_plans_';    // Always LocalStorage (User Data)

  // --- Auth Management ---

  register(name: string, email: string, password: string, rememberMe: boolean): UserProfile {
    const users = this.getAllUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const newUser: AuthUser = {
      name,
      email,
      password,
      memberSince: new Date().toLocaleDateString('pt-BR')
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
    
    // Auto login after register
    return this.createSession(newUser, rememberMe);
  }

  login(email: string, password: string, rememberMe: boolean): UserProfile {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    return this.createSession(user, rememberMe);
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  getCurrentSession(): UserProfile | null {
    // Check LocalStorage (Remember Me) first, then SessionStorage (One-time session)
    const localSession = localStorage.getItem(this.SESSION_KEY);
    if (localSession) return JSON.parse(localSession);

    const tempSession = sessionStorage.getItem(this.SESSION_KEY);
    if (tempSession) return JSON.parse(tempSession);

    return null;
  }

  // --- Data Management (Scoped by User) ---

  getPlans(): SavedPlan[] {
    const user = this.getCurrentSession();
    if (!user) return [];

    const key = this.getPlanKey(user.email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  savePlan(plan: SavedPlan): void {
    const user = this.getCurrentSession();
    if (!user) return;

    const plans = this.getPlans();
    plans.unshift(plan); // Add to top
    
    const key = this.getPlanKey(user.email);
    localStorage.setItem(key, JSON.stringify(plans));
  }

  updatePlan(updatedPlan: SavedPlan): void {
    const user = this.getCurrentSession();
    if (!user) return;

    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      plans[index] = updatedPlan;
      const key = this.getPlanKey(user.email);
      localStorage.setItem(key, JSON.stringify(plans));
    }
  }

  deletePlan(id: string): void {
    const user = this.getCurrentSession();
    if (!user) return;

    const plans = this.getPlans().filter(p => p.id !== id);
    const key = this.getPlanKey(user.email);
    localStorage.setItem(key, JSON.stringify(plans));
  }

  // --- Helpers ---

  private getAllUsers(): AuthUser[] {
    const data = localStorage.getItem(this.USERS_DB_KEY);
    return data ? JSON.parse(data) : [];
  }

  private createSession(user: AuthUser, rememberMe: boolean): UserProfile {
    // Return safe object without password
    const safeProfile: UserProfile = {
      name: user.name,
      email: user.email,
      memberSince: user.memberSince
    };

    const sessionStr = JSON.stringify(safeProfile);

    // Clear previous sessions to avoid conflicts
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);

    if (rememberMe) {
      localStorage.setItem(this.SESSION_KEY, sessionStr);
    } else {
      sessionStorage.setItem(this.SESSION_KEY, sessionStr);
    }

    return safeProfile;
  }

  private getPlanKey(email: string): string {
    return `${this.PLAN_PREFIX}${email}`;
  }
}