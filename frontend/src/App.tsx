import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/layout/AppLayout';
import RolesPage from './pages/admin/RolesPage';
import PoliciesPage from './pages/admin/PoliciesPage';
import UsersPage from './pages/admin/UsersPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin/roles" element={<RolesPage />} />
          <Route path="admin/policies" element={<PoliciesPage />} />
          <Route path="admin/users" element={<UsersPage />} />
          <Route
            path="admin/permission-matrix"
            element={
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Permission Matrix</h2>
                <p className="text-muted-foreground mt-2">Coming soon...</p>
              </div>
            }
          />
          <Route
            path="admin/audit-logs"
            element={
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Audit Logs</h2>
                <p className="text-muted-foreground mt-2">Coming soon...</p>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
