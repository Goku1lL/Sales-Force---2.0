// Import all API modules to ensure they are registered with the main API
import '../features/auth/authApi';
import '../features/dashboard/dashboardApi';
import '../features/leaderboard/leaderboardApi';
import '../features/targets/targetsApi';
import '../features/customers/customersApi';
import '../features/incentives/incentivesApi';
// This file ensures all API endpoints are registered with the main API
// by importing all the API modules that use api.injectEndpoints()
