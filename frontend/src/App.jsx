import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Deliverables = lazy(() => import('./pages/Deliverables'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const Risk = lazy(() => import('./pages/Risk'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const PendingRegistrations = lazy(() => import('./pages/PendingRegistrations'));
const Import = lazy(() => import('./pages/Import'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Team = lazy(() => import('./pages/Team'));
const Reports = lazy(() => import('./pages/Reports'));
const OrgSecurity = lazy(() => import('./pages/OrgSecurity'));
const DocumentManagement = lazy(() => import('./pages/DocumentManagement'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
            <Route
              path="projects"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><Projects /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="projects/:id"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper><ProjectDetails /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="deliverables"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><Deliverables /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="board"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><TaskBoard /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="risk"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><Risk /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute adminOnly>
                  <SuspenseWrapper><UserManagement /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="registrations"
              element={
                <ProtectedRoute pmOnly>
                  <SuspenseWrapper><PendingRegistrations /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="import"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><Import /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="portfolio"
              element={
                <ProtectedRoute adminOnly>
                  <SuspenseWrapper><Portfolio /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="team"
              element={
                <ProtectedRoute adminOnly>
                  <SuspenseWrapper><Team /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><Reports /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="org-security"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><OrgSecurity /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="documents"
              element={
                <ProtectedRoute adminOrPm>
                  <SuspenseWrapper><DocumentManagement /></SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
