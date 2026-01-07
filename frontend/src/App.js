import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "./components/ui/toaster";
import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import CommandPalette from "./components/CommandPalette";

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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
          <Toaster />
        </AppProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
