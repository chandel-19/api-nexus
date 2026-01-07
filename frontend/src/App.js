import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "./components/ui/toaster";
import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import CommandPalette from "./components/CommandPalette";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TabBar />
      </div>
      <CommandPalette />
    </div>
  );
};

// Router component to handle auth callback
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppProvider>
          <AppRouter />
          <Toaster />
        </AppProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
