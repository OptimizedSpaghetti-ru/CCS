import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Splash } from './screens/Splash';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { Home } from './screens/Home';
import { Messages } from './screens/Messages';
import { Chat } from './screens/Chat';
import { Compose } from './screens/Compose';
import { GroupChat } from './screens/GroupChat';
import { MapView } from './screens/MapView';
import { MapSearch } from './screens/MapSearch';
import { LocationDetail } from './screens/LocationDetail';
import { Profile } from './screens/Profile';
import { EditProfile } from './screens/EditProfile';
import { Settings } from './screens/Settings';
import { Security } from './screens/Security';
import { Notifications } from './screens/Notifications';
import { NotificationSettings } from './screens/NotificationSettings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Splash,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/app',
    Component: AppLayout,
    children: [
      { index: true, Component: Home },
      { path: 'home', Component: Home },
      { path: 'messages', Component: Messages },
      { path: 'messages/compose', Component: Compose },
      { path: 'messages/group/:id', Component: GroupChat },
      { path: 'messages/:id', Component: Chat },
      { path: 'map', Component: MapView },
      { path: 'map/search', Component: MapSearch },
      { path: 'map/location/:id', Component: LocationDetail },
      { path: 'notifications', Component: Notifications },
      { path: 'notifications/settings', Component: NotificationSettings },
      { path: 'profile', Component: Profile },
      { path: 'profile/edit', Component: EditProfile },
      { path: 'settings', Component: Settings },
      { path: 'settings/security', Component: Security },
    ],
  },
]);
