import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { eventTracker } from '../../services/eventTracker';

interface UserInfo {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
}

const AUTH_STORAGE_KEY = 'sfa_auth';

let initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
};

// Hydrate from localStorage if present so refresh doesn't drop auth
try {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved) || {};
    initialState = {
      token: parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
    } as AuthState;
    
    // Initialize event tracking if user is already logged in
    if (initialState.user?.employee_id) {
      eventTracker.setEmployee(initialState.user.employee_id);
    }
  }
} catch {}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; refreshToken?: string; user: UserInfo }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user;
      
      // Initialize event tracking with employee ID
      if (state.user?.employee_id) {
        eventTracker.setEmployee(state.user.employee_id);
      }
      
      try {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: state.token, refreshToken: state.refreshToken, user: state.user })
        );
      } catch {}
    },
    logout: (state) => {
      // Track logout event before clearing employee ID
      eventTracker.track('user_logout', {
        employee_id: state.user?.employee_id
      });
      
      // Clear event tracking
      eventTracker.clearEmployee();
      
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export { AUTH_STORAGE_KEY };
