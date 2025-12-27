import type { RouteObject } from "react-router-dom";
import { lazy } from "react";
import NotFound from "../pages/NotFound";
import Splash from "../pages/splash/page";
import Home from "../pages/home/page";
import CreatePrediction from "../pages/create/page";
import Login from "../pages/login/page";
import Profile from "../pages/profile/page";
import Labs from "../pages/labs/page";
import AchievementsPage from "../pages/achievements/page";
import AdminPage from "../pages/admin/page";
import AnalyticsPage from "../pages/analytics/page";

const LazyLeaderboard = lazy(() => import('../pages/leaderboard/page'));
const LazyMarketDetail = lazy(() => import('../pages/market-detail/page'));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Splash />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/market/:id",
    element: <LazyMarketDetail />,
  },
  {
    path: "/create",
    element: <CreatePrediction />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/labs",
    element: <Labs />,
  },
  {
    path: '/leaderboard',
    element: <LazyLeaderboard />,
  },
  {
    path: '/achievements',
    element: <AchievementsPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/analytics',
    element: <AnalyticsPage />
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
