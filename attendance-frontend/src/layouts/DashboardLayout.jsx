
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  Users,
  UserCheck,
  Building2
} from "lucide-react";

import useLogout from "../hooks/useLogout";


const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // const handleLogout = () => {
  //   localStorage.removeItem("loggedInUser");
  //   navigate("/");
  // };

  
const logout = useLogout();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white shadow-md transition-all duration-300 flex flex-col ${
          collapsed ? "w-20 p-2" : "w-64 p-4"
        }`}
      >

        {/* Header */}
        <div className="mb-6">

          {collapsed ? (
            <div className="flex justify-center">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">
                Admin Panel
              </h2>

              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={20} />
              </button>
            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="space-y-1">

          <button
            onClick={() => navigate("/admin/dashboard")}
            className={`flex items-center w-full py-2 rounded-lg transition whitespace-nowrap ${
              collapsed ? "justify-center" : "gap-3 px-4 justify-start"
            } ${
              isActive("/admin/dashboard")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!collapsed && "Dashboard"}
          </button>

          <button
            onClick={() => navigate("/manage-analysts")}
            className={`flex items-center w-full py-2 rounded-lg transition whitespace-nowrap ${
              collapsed ? "justify-center" : "gap-3 px-4 justify-start"
            } ${
              isActive("/manage-analysts")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users size={18} className="shrink-0" />
            {!collapsed && "Manage Analysts"}
          </button>

          <button
            onClick={() => navigate("/manage-counsellors")}
            className={`flex items-center w-full py-2 rounded-lg transition whitespace-nowrap ${
              collapsed ? "justify-center" : "gap-3 px-4 justify-start"
            } ${
              isActive("/manage-counsellors")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <UserCheck size={18} className="shrink-0" />
            {!collapsed && "Manage Counsellors"}
          </button>

          <button
            onClick={() => navigate("/manage-centers")}
            className={`flex items-center w-full py-2 rounded-lg transition whitespace-nowrap ${
              collapsed ? "justify-center" : "gap-3 px-4 justify-start"
            } ${
              isActive("/manage-centers")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Building2 size={18} className="shrink-0" />
            {!collapsed && "Manage Centers"}
          </button>

        </div>
      </div>

      {/* Topbar */}
      <div
        className={`fixed top-0 right-0 bg-white shadow-sm px-8 py-4 flex justify-between items-center z-40 transition-all duration-300 ${
          collapsed ? "left-20" : "left-64"
        }`}
      >
        
        <h1 className="text-2xl italic font-semibold text-gray-800 whitespace-nowrap">
          STUDENT ATTENDANCE MANAGEMENT SYSTEM
        </h1>

        <div className="flex items-center gap-4">

          <span className="text-sm text-gray-500 whitespace-nowrap">
            Admin
          </span>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition whitespace-nowrap"
          >
            Logout
          </button>

        </div>

      </div>

      {/* Content */}
      <div
        className={`pt-24 p-8 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </div>

    </div>
  );
};

export default DashboardLayout;
