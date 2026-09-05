import { Outlet } from "react-router-dom";

export default function CRMLayout() {
  return (
    <div className="min-h-screen bg-[#070b14]">
      <Outlet />
    </div>
  );
}