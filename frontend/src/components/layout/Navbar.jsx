import NotificationDropdown from "../NotificationDropdown";
import ProfileDropdown from "../ProfileDropdown";

export default function Navbar() {
  return (
    <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">

      <div>
        <h1 className="text-2xl font-bold text-white">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-6">

        <NotificationDropdown />
        
        <ProfileDropdown />

        

      </div>

    </header>
  );
}