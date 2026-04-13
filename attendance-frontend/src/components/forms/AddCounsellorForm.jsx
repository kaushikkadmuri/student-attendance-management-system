// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import DashboardLayout from "../../layouts/DashboardLayout";

// const STORAGE_KEY = "counsellors";

// const AddCounsellorForm = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [centers, setCenters] = useState([]);

//   const [formData, setFormData] = useState({
//     id: null,
//     name: "",
//     mobile: "",
//     email: "",
//     password: "",
//     gender: "",
//     assignedCenter: ""
//   });

//   useEffect(() => {
//   const storedCenters =
//     JSON.parse(localStorage.getItem("centers")) || [];
//   setCenters(storedCenters);
// }, []);


//   useEffect(() => {
//     if (location.state?.counsellor) {
//       setFormData(location.state.counsellor);
//     }
//   }, [location.state]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const existing =
//       JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

//     let updated;

//     if (formData.id) {
//       updated = existing.map((c) =>
//         c.id === formData.id ? formData : c
//       );
//     } else {
//       updated = [...existing, { ...formData, id: Date.now() }];
//     }

//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     navigate("/counsellors");
//   };

//   return (
//     <DashboardLayout>
//   {/* <div className="bg-gray-100 min-h-screen p-8"> */}

//     <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">

//       <h1 className="text-xl font-semibold text-gray-800 mb-6">
//         {formData.id ? "Edit Counsellor" : "Add Counsellor"}
//       </h1>

//       <form onSubmit={handleSubmit} className="space-y-4">

//         <input
//           name="name"
//           placeholder="Name"
//           value={formData.name}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <input
//           name="mobile"
//           placeholder="Mobile"
//           value={formData.mobile}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <input
//           name="email"
//           type="email"
//           placeholder="Email"
//           value={formData.email}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <input
//           name="password"
//           type="password"
//           placeholder="Password"
//           value={formData.password}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <select
//           name="gender"
//           value={formData.gender}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         >
//           <option value="" disabled>Select Gender</option>
//           <option value="Male">Male</option>
//           <option value="Female">Female</option>
//         </select>

//         <select
//           name="assignedCenter"
//           value={formData.assignedCenter}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         >
//           <option value="" disabled>Select Center</option>
//           {centers.map(center => (
//             <option key={center.id} value={center.centerName}>
//               {center.centerName}
//             </option>
//           ))}
//         </select>

//         <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition">
//           {formData.id ? "Update Counsellor" : "Add Counsellor"}
//         </button>

//       </form>
//     </div>
//   {/* </div> */}
//   </DashboardLayout>
// );

// };

// export default AddCounsellorForm;


import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";

const AddCounsellorForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = location.state?.counsellor ? true : false;

  const [centers, setCenters] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    mobile: "",
    email: "",
    password: "",
    gender: "",
    center: ""
  });

  // 🔹 Fetch centers from backend
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await api.get("centers/");
        setCenters(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCenters();
  }, []);

  // 🔹 Prefill for edit
  useEffect(() => {
    if (isEdit) {
      const counsellor = location.state.counsellor;

      setFormData({
        id: counsellor.id,
        name: counsellor.name || "",
        mobile: counsellor.mobile || "",
        email: counsellor.email || "",
        password: "",
        gender: counsellor.gender || "",
        center: counsellor.centerId || ""
      });
    }
  }, [isEdit, location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await api.put(`auth/update-counsellor/${formData.id}/`, {
          email: formData.email,
          name: formData.name,
          password: formData.password,
          center: formData.center,
          mobile: formData.mobile,
          gender: formData.gender
        });
      } else {
        await api.post("auth/create-counsellor/", {
          email: formData.email,
          name: formData.name,
          password: formData.password,
          center: formData.center,
          mobile: formData.mobile,
          gender: formData.gender
        });
      }

      navigate("/counsellors");

    } catch (error) {
      console.log(error.response?.data);
      alert("Error saving counsellor");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-xl font-semibold text-gray-800 mb-6">
          {isEdit ? "Edit Counsellor" : "Add Counsellor"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="mobile"
            placeholder="Mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required={!isEdit}
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            name="center"
            value={formData.center}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          >
            <option value="" disabled>Select Center</option>
            {centers.map(center => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>

          <button className="w-full bg-green-600 text-white py-2.5 rounded-lg">
            {isEdit ? "Update Counsellor" : "Add Counsellor"}
          </button>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddCounsellorForm;