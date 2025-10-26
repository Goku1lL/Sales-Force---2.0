import { Provider, useSelector } from 'react-redux';
import { store, type RootState } from './app/store';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './shared/ThemeContext';
import './shared/apiRegistry'; // Ensure all APIs are registered
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ThemeTestPage from './features/dashboard/ThemeTestPage';
import TargetsPage from './features/targets/TargetsPage';
import CustomersPage from './features/customers/CustomersPage';
import IncentivesPage from './features/incentives/IncentivesPage';
import LeaderBoardPage from './features/leaderboard/LeaderBoardPage';
import Layout from './shared/Layout';
import SignupPage from './features/auth/SignupPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useSelector((s: RootState) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppInner() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/theme-test" element={<ThemeTestPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/targets" element={<TargetsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          {/* <Route path="/incentives" element={<IncentivesPage />} /> */}
          <Route path="/leaderboard" element={<LeaderBoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </Provider>
  );
}
