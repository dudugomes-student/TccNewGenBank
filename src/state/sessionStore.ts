import { create } from 'zustand';

const SESSION_KEY = 'ngb2:session';

interface SessionState {
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: sessionStorage.getItem(SESSION_KEY) === 'active',
  signIn: () => {
    sessionStorage.setItem(SESSION_KEY, 'active');
    set({ isAuthenticated: true });
  },
  signOut: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ isAuthenticated: false });
  },
}));
