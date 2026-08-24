import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import NewIncident from './pages/NewIncident';
import IncidentDetail from './pages/IncidentDetail';
import Runbooks from './pages/Runbooks';

// Layout wrapper — adds the sidebar to all protected pages
const AppLayout = ({ children }) => (
  <div className="flex bg-slate-900 min-h-screen">
    <Sidebar />
    <main className="flex-1 ml-64 p-8 overflow-auto">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected routes — require login */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/incidents" element={
              <ProtectedRoute>
                <AppLayout><Incidents /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/incidents/new" element={
              <ProtectedRoute>
                <AppLayout><NewIncident /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/incidents/:id" element={
              <ProtectedRoute>
                <AppLayout><IncidentDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/runbooks" element={
              <ProtectedRoute>
                <AppLayout><Runbooks /></AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
