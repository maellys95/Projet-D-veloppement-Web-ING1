import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import Home        from './pages/Home';
import Login       from './pages/Login';
import Register    from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Actualites  from './pages/Actualites';
import Devices     from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import DeviceNew   from './pages/DeviceNew';
import Profile     from './pages/Profile';
import Members     from './pages/Members';
import Dashboard   from './pages/Dashboard';
import Admin       from './pages/Admin';

function PrivateRoute({ children, level }) {
  const { user, isAtLeast, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (level && !isAtLeast(level)) return <Navigate to="/devices" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/verify-email"  element={<VerifyEmail />} />
        <Route path="/actualites"    element={<Actualites />} />

        <Route path="/devices"      element={<PrivateRoute><Devices /></PrivateRoute>} />
        <Route path="/devices/new"  element={<PrivateRoute level="avancé"><DeviceNew /></PrivateRoute>} />
        <Route path="/devices/:id"  element={<PrivateRoute><DeviceDetail /></PrivateRoute>} />

        <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/members"    element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/dashboard"  element={<PrivateRoute level="avancé"><Dashboard /></PrivateRoute>} />
        <Route path="/admin"      element={<PrivateRoute level="expert"><Admin /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
