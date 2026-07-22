import { create } from "zustand";
import { clearTokens, setTokens } from "../utils/token";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  businessModules: string[];
  avatar?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

// Mock user for initial load if token exists
const getInitialUser = (): User | null => {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem("accessToken"),
  user: getInitialUser(),
  setAuth: (token: string, user: User) => {
    setTokens(token, ""); // store in localStorage
    localStorage.setItem("user", JSON.stringify(user));
    set({ isAuthenticated: true, user });
  },
  logout: () => {
    clearTokens();
    localStorage.removeItem("user");
    set({ isAuthenticated: false, user: null });
  },
}));
