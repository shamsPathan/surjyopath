import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProcessingIndicator from "./ProcessingIndicator";

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg bg-dot-grid">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
        <Outlet />
      </main>
      <ProcessingIndicator />
    </div>
  );
}