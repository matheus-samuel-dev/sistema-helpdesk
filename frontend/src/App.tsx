import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, Protected, useAuth } from './auth';
import DocumentMetadata from './components/DocumentMetadata';
import Layout from './components/Layout';
import Loading from './components/Loading';

const Activities = lazy(() => import('./pages/Activities'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const NewTicket = lazy(() => import('./pages/NewTicket'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Users = lazy(() => import('./pages/Users'));

function AdminOnly() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <Users /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <DocumentMetadata />
      <AuthProvider>
        <Suspense fallback={<Loading label="Carregando interface..." />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/new" element={<NewTicket />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/users" element={<AdminOnly />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
