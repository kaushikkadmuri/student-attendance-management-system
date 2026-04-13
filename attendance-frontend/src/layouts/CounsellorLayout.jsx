// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { Menu } from "lucide-react";

// const CounsellorLayout = ({ children }) => {

//   const navigate = useNavigate();
//   const [collapsed, setCollapsed] = useState(false);

//   const loggedInUser =
//     JSON.parse(localStorage.getItem("loggedInUser")) || {};

//   const handleLogout = () => {
//     localStorage.removeItem("loggedInUser");
//     navigate("/");
//   };

//   return (
//     <div className="bg-gray-100 min-h-screen">

//       {/* Sidebar */}
//       <div
//         className={`fixed left-0 top-0 h-screen bg-white shadow-md transition-all duration-300 flex flex-col ${
//           collapsed ? "w-20 p-2" : "w-64 p-4"
//         }`}
//       >

//         <div className="mb-6 flex justify-between items-center">
//           {!collapsed && (
//             <h2 className="text-xl font-bold">
//               Counsellor Panel
//             </h2>
//           )}

//           <button
//             onClick={() => setCollapsed(!collapsed)}
//             className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg"
//           >
//             <Menu size={20} />
//           </button>
//         </div>

//         <div className="space-y-2">

//           <button
//             onClick={() => navigate("/counsellor-dashboard")}
//             className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
//           >
//             {!collapsed ? "Dashboard" : "D"}
//           </button>

//           <button
//             onClick={() => navigate("/counsellor/students")}
//             className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
//           >
//             {!collapsed ? "Manage Students" : "S"}
//           </button>

//         </div>
//       </div>

//       {/* Topbar */}
//       <div
//         className={`fixed top-0 right-0 bg-white shadow px-8 py-4 flex justify-between items-center ${
//           collapsed ? "left-20" : "left-64"
//         }`}
//       >
//         <h1 className="font-semibold">
//           Counsellor Dashboard
//         </h1>

//         <div className="flex items-center gap-4">
//           <span>{loggedInUser.name}</span>

//           <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
//             {loggedInUser.assignedCenter}
//           </span>

//           <button
//             onClick={handleLogout}
//             className="bg-red-500 text-white px-4 py-2 rounded"
//           >
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* Content */}
//       <div
//         className={`pt-24 p-8 ${
//           collapsed ? "ml-20" : "ml-64"
//         }`}
//       >
//         {children}
//       </div>

//     </div>
//   );
// };

// export default CounsellorLayout;


import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, LayoutDashboard, Users } from "lucide-react";
import api from "../api/axios";
import { clearAccessToken } from "../utils/tokenService";

const CounsellorLayout = ({ children }) => {

  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("auth/me/");
        const data = res.data;

        // Role protection
        if (data.role !== "COUNSELLOR") {
          navigate("/");
          return;
        }

        setUser(data);

      } catch (error) {
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("auth/logout/");
    } catch (error) {
      // Continue local logout even if backend logout fails.
    }
    clearAccessToken();
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  if (!user) return null;

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white shadow-md transition-all duration-300 flex flex-col ${
          collapsed ? "w-20 p-2" : "w-64 p-4"
        }`}
      >

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
                Counsellor Panel
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

        <div className="space-y-1">

          <button
            onClick={() => navigate("/counsellor/dashboard")}
            className={`flex items-center w-full py-2 rounded-lg transition whitespace-nowrap ${
              collapsed ? "justify-center" : "gap-3 px-4 justify-start"
            } ${
              isActive("/counsellor/dashboard")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!collapsed && "Dashboard"}
          </button>

          <button
            onClick={() => navigate("/counsellor/students")}
            className={`flex items-center w-full py-2 rounded-lg transition whitespace-nowrap ${
              collapsed ? "justify-center" : "gap-3 px-4 justify-start"
            } ${
              isActive("/counsellor/students")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users size={18} className="shrink-0" />
            {!collapsed && "Manage Students"}
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
            {user.first_name || user.email}
          </span>

          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {user.center || "No Center"}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className={`pt-24 p-8 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </div>

    </div>
  );
};

export default CounsellorLayout;
