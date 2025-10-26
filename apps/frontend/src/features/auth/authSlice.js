import { createSlice } from '@reduxjs/toolkit';
const AUTH_STORAGE_KEY = 'sfa_auth';
let initialState = {
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
        };
    }
}
catch { }
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken ?? null;
            state.user = action.payload.user;
            try {
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: state.token, refreshToken: state.refreshToken, user: state.user }));
            }
            catch { }
        },
        logout: (state) => {
            state.token = null;
            state.refreshToken = null;
            state.user = null;
            try {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            }
            catch { }
        },
    },
});
export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export { AUTH_STORAGE_KEY };
