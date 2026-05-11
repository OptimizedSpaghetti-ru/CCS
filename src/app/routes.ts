import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Splash } from "./screens/Splash";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";
import { Home } from "./screens/Home";
import { Messages } from "./screens/Messages";
import { Chat } from "./screens/Chat";
import { Compose } from "./screens/Compose";
import { GroupChat } from "./screens/GroupChat";
import { MapView } from "./screens/MapView";
import { MapSearch } from "./screens/MapSearch";
import { LocationDetail } from "./screens/LocationDetail";
import { Profile } from "./screens/Profile";
import { HelpSupport } from "./screens/HelpSupport";
import { EditProfile } from "./screens/EditProfile";
import { Settings } from "./screens/Settings";
import { PrivacyPolicy, TermsOfService } from "./screens/LegalPage";
import { Security } from "./screens/Security";
import { Notifications } from "./screens/Notifications";
import { NotificationSettings } from "./screens/NotificationSettings";
import { PendingApproval } from "./screens/PendingApproval";
import { AdminDashboard } from "./screens/AdminDashboard";
import { AdminAnalytics } from "./screens/AdminAnalytics";
import { FacultyAnnouncements } from "./screens/FacultyAnnouncements";
import { Assistance } from "./screens/Assistance";
import { ITSupportDashboard } from "./screens/ITSupportDashboard";
import {
  ApprovedGuard,
  AdminGuard,
  FacultyGuard,
  ITSupportGuard,
} from "./components/guards/AuthGuards";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Splash,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/pending-approval",
    Component: PendingApproval,
  },
  {
    path: "/app",
    Component: ApprovedGuard,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, Component: Home },
          { path: "home", Component: Home },
          { path: "messages", Component: Messages },
          { path: "messages/compose", Component: Compose },
          { path: "messages/group/:id", Component: GroupChat },
          { path: "messages/:id", Component: Chat },
          { path: "map", Component: MapView },
          { path: "map/search", Component: MapSearch },
          { path: "map/location/:id", Component: LocationDetail },
          { path: "notifications", Component: Notifications },
          { path: "notifications/settings", Component: NotificationSettings },
          { path: "assistance", Component: Assistance },
          { path: "profile", Component: Profile },
          { path: "help-support", Component: HelpSupport },
          { path: "profile/edit", Component: EditProfile },
          { path: "settings", Component: Settings },
          { path: "settings/terms", Component: TermsOfService },
          { path: "settings/privacy", Component: PrivacyPolicy },
          { path: "settings/security", Component: Security },
          {
            path: "admin",
            Component: AdminGuard,
            children: [
              { index: true, Component: AdminDashboard },
              { path: "analytics", Component: AdminAnalytics },
            ],
          },
          {
            path: "it-support",
            Component: ITSupportGuard,
            children: [{ index: true, Component: ITSupportDashboard }],
          },
          {
            path: "faculty",
            Component: FacultyGuard,
            children: [
              {
                path: "announcements",
                Component: FacultyAnnouncements,
              },
            ],
          },
        ],
      },
    ],
  },
]);
