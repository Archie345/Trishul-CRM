import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64">

        <Navbar />

        <main className="p-8">
          {children}
        </main>

      </div>

    </div>
  );
}