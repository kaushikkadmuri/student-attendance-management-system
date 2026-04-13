
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api/axios";
// import { clearAccessToken } from "../utils/tokenService";

// const StudentLayout = ({ children }) => {
//   const navigate = useNavigate();

//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);

//   /* ---------------- AUTH + ROLE CHECK ---------------- */
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await api.get("auth/me/");
//         const data = res.data;

//         // Role protection (case-safe)
//         if (data.role?.toUpperCase() !== "STUDENT") {
//           navigate("/");
//           return;
//         }

//         setUser(data);

//         // Fetch student profile details
//         const profileRes = await api.get("students/me/");
//         setProfile(profileRes.data);

//       } catch (error) {
//         navigate("/");
//       }
//     };

//     fetchUser();
//   }, [navigate]);

//   const handleLogout = () => {
//     clearAccessToken();
//     navigate("/");
//   };

//   const getInitials = (name = "Student") =>
//     name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase();

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-gray-100">

//       {/* HEADER */}
//       <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
//         <div className="flex items-center gap-4">

//           {/* PHOTO */}
//           {profile?.photo ? (
//             <img
//               src={profile.photo}
//               alt="Profile"
//               className="w-10 h-10 rounded-full object-cover border"
//             />
//           ) : (
//             <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
//               {getInitials(user.first_name)}
//             </div>
//           )}

//           <div>
//             <h2 className="text-lg font-semibold">
//               Welcome, {user.first_name}
//             </h2>
//             <p className="text-sm text-gray-500">
//               Batch: {profile?.batch_name || "-"} | Center: {user.center || "-"}
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={handleLogout}
//           className="bg-red-500 text-white px-4 py-2 rounded"
//         >
//           Logout
//         </button>
//       </div>

//       {/* CONTENT */}
//       <div className="p-6">{children}</div>
//     </div>
//   );
// };

// export default StudentLayout;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { clearAccessToken } from "../utils/tokenService";

const StudentLayout = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("auth/me/");
        const data = res.data;

        if (data.role !== "STUDENT") {
          navigate("/");
          return;
        }

        setUser(data);

      } catch {
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    clearAccessToken();
    navigate("/");
  };

  const getInitials = (name = "Student") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">

          {user.photo ? (
            <img
              src={user.photo}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {getInitials(user.first_name)}
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold">
              Welcome, {user.first_name}
            </h2>
            <p className="text-sm text-gray-500">
              Batch: {user.batch_name || "-"} | Center: {user.center || "-"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
};

export default StudentLayout;