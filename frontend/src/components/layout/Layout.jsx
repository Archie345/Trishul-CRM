import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CRMFooter from "../CRMFooter";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex overflow-x-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="ml-64 min-h-screen min-w-0 flex-1 bg-slate-950 flex flex-col overflow-x-hidden">

        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 w-full min-w-0 bg-slate-950 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <CRMFooter />

      </div>

    </div>
  );
}