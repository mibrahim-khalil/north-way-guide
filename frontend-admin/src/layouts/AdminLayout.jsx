import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

export default function AdminLayout() {
  return (
    <div className="adminShell">
      <Sidebar />
      <div className="adminMain">
        <Topbar />
        <div className="adminContent">
          <Outlet />
        </div>
      </div>
    </div>
  );
}