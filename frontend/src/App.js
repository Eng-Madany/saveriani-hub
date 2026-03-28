import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Diario } from "./pages/Diario";
import { Consegne } from "./pages/Consegne";
import { Pasti } from "./pages/Pasti";
import { Lavanderia } from "./pages/Lavanderia";
import { Residenti } from "./pages/Residenti";
import { Report } from "./pages/Report";
import { Backup } from "./pages/Backup";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading } = useApp();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diario"
        element={
          <ProtectedRoute>
            <Diario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consegne"
        element={
          <ProtectedRoute>
            <Consegne />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pasti"
        element={
          <ProtectedRoute>
            <Pasti />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lavanderia"
        element={
          <ProtectedRoute>
            <Lavanderia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/residenti"
        element={
          <ProtectedRoute>
            <Residenti />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
      />
      <Route
        path="/backup"
        element={
          <ProtectedRoute>
            <Backup />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="App dark">
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 9%)',
              color: 'hsl(0 0% 98%)',
              border: '1px solid hsl(0 0% 20%)',
            }
          }}
        />
      </div>
    </AppProvider>
  );
}

export default App;
