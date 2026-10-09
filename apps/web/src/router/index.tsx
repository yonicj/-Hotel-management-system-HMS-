import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';

// Auth
import Login from '../pages/auth/Login';

// Layout
import { AppShell } from '../components/layout/AppShell';

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard';

// Reservations
import ReservationList from '../pages/reservations/ReservationList';
import ReservationForm from '../pages/reservations/ReservationForm';
import ReservationDetail from '../pages/reservations/ReservationDetail';

// Front Desk
import Arrivals from '../pages/front-desk/Arrivals';
import Departures from '../pages/front-desk/Departures';
import InHouse from '../pages/front-desk/InHouse';
import CheckInForm from '../pages/front-desk/CheckInForm';
import CheckOutForm from '../pages/front-desk/CheckOutForm';

// Rooms
import RoomRack from '../pages/rooms/RoomRack';
import RoomList from '../pages/rooms/RoomList';

// Housekeeping
import HousekeepingBoard from '../pages/housekeeping/HousekeepingBoard';
import TaskDetail from '../pages/housekeeping/TaskDetail';

// Guests
import GuestList from '../pages/guests/GuestList';
import GuestForm from '../pages/guests/GuestForm';
import GuestProfile from '../pages/guests/GuestProfile';

// Billing
import FolioView from '../pages/billing/FolioView';

// Night Audit
import NightAudit from '../pages/night-audit/NightAudit';

// Reports
import OccupancyReport from '../pages/reports/OccupancyReport';
import RevenueReport from '../pages/reports/RevenueReport';

// Settings
import UserManagement from '../pages/settings/UserManagement';
import RolePermissions from '../pages/settings/RolePermissions';
import RoomTypes from '../pages/settings/RoomTypes';
import RatePlans from '../pages/settings/RatePlans';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },

          // Reservations
          { path: '/reservations', element: <ReservationList /> },
          { path: '/reservations/new', element: <ReservationForm /> },
          { path: '/reservations/:id', element: <ReservationDetail /> },
          { path: '/reservations/:id/edit', element: <ReservationForm /> },

          // Front Desk
          { path: '/front-desk/arrivals', element: <Arrivals /> },
          { path: '/front-desk/departures', element: <Departures /> },
          { path: '/front-desk/in-house', element: <InHouse /> },
          { path: '/front-desk/check-in/:reservationId', element: <CheckInForm /> },
          { path: '/front-desk/check-out/:reservationId', element: <CheckOutForm /> },

          // Rooms
          { path: '/rooms', element: <RoomList /> },
          { path: '/rooms/rack', element: <RoomRack /> },

          // Housekeeping
          { path: '/housekeeping', element: <HousekeepingBoard /> },
          { path: '/housekeeping/tasks/:id', element: <TaskDetail /> },

          // Guests
          { path: '/guests', element: <GuestList /> },
          { path: '/guests/new', element: <GuestForm /> },
          { path: '/guests/:id', element: <GuestProfile /> },
          { path: '/guests/:id/edit', element: <GuestForm /> },

          // Billing
          { path: '/billing/:folioId', element: <FolioView /> },

          // Night Audit
          { path: '/night-audit', element: <NightAudit /> },

          // Reports
          { path: '/reports/occupancy', element: <OccupancyReport /> },
          { path: '/reports/revenue', element: <RevenueReport /> },

          // Settings
          { path: '/settings/users', element: <UserManagement /> },
          { path: '/settings/roles', element: <RolePermissions /> },
          { path: '/settings/room-types', element: <RoomTypes /> },
          { path: '/settings/rate-plans', element: <RatePlans /> },
        ],
      },
    ],
  },
]);
