import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { Layout } from './components/Layout';

// Direct implementations matching Reference Images 1–12
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { ModelEvaluation } from './pages/ModelEvaluation';
import { ExperimentCenter } from './pages/ExperimentCenter';
import { Analytics } from './pages/Analytics';
import { AdminDashboard } from './pages/AdminDashboard';
import { Security } from './pages/Security';
import { SupportTickets } from './pages/SupportTickets';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route (Reference Image 2) */}
      <Route path="/login" element={<Login />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Main Dashboard (Reference Image 3) */}
      <Route
        path="/dashboard"
        element={
          <AuthGate>
            <Layout title="Dashboard">
              <Dashboard />
            </Layout>
          </AuthGate>
        }
      />

      {/* RAG Chat Assistant (Reference Image 4) */}
      <Route
        path="/chat"
        element={
          <AuthGate>
            <Layout title="AI Assistant">
              <Chat />
            </Layout>
          </AuthGate>
        }
      />
      <Route path="/conversations" element={<Navigate to="/chat" replace />} />

      {/* Knowledge Base & Document Ingestion (Reference Image 5) */}
      <Route
        path="/knowledge"
        element={
          <AuthGate>
            <Layout title="Knowledge Base">
              <KnowledgeBase />
            </Layout>
          </AuthGate>
        }
      />
      <Route
        path="/documents"
        element={
          <AuthGate>
            <Layout title="Document Library">
              <KnowledgeBase />
            </Layout>
          </AuthGate>
        }
      />

      {/* Model & Evaluation (Reference Image 6) */}
      <Route
        path="/model-evaluation"
        element={
          <AuthGate>
            <Layout title="Model & Evaluation">
              <ModelEvaluation />
            </Layout>
          </AuthGate>
        }
      />

      {/* Experiment Center (Reference Image 7) */}
      <Route
        path="/experiments"
        element={
          <AuthGate>
            <Layout title="Experiment Center">
              <ExperimentCenter />
            </Layout>
          </AuthGate>
        }
      />

      {/* Analytics & BI Dashboard (Reference Image 8) */}
      <Route
        path="/analytics"
        element={
          <AuthGate>
            <Layout title="Analytics">
              <Analytics />
            </Layout>
          </AuthGate>
        }
      />

      {/* Admin Dashboard & Users (Reference Image 9) */}
      <Route
        path="/admin"
        element={
          <AuthGate>
            <Layout title="Admin Dashboard">
              <AdminDashboard />
            </Layout>
          </AuthGate>
        }
      />
      <Route
        path="/users"
        element={
          <AuthGate>
            <Layout title="User Management">
              <AdminDashboard />
            </Layout>
          </AuthGate>
        }
      />

      {/* Security & Access Controls (Reference Image 10) */}
      <Route
        path="/security"
        element={
          <AuthGate>
            <Layout title="Security Center">
              <Security />
            </Layout>
          </AuthGate>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGate>
            <Layout title="Settings">
              <Security />
            </Layout>
          </AuthGate>
        }
      />

      {/* Customer Support Tickets Queue & Escalations */}
      <Route
        path="/support-tickets"
        element={
          <AuthGate>
            <Layout title="Support Tickets">
              <SupportTickets />
            </Layout>
          </AuthGate>
        }
      />

      <Route path="/tickets" element={<Navigate to="/support-tickets" replace />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return <AppRoutes />;
}

export default App;
