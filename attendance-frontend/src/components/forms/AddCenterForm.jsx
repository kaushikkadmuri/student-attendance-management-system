// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import DashboardLayout from "../../layouts/DashboardLayout";

// const STORAGE_KEY = "centers";

// const AddCenterForm = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [formData, setFormData] = useState({
//   id: null,
//   centerName: "",
//   location: "",
//   latitude: "",
//   longitude: "",
//   allowedRadius: ""
// });


//   useEffect(() => {
//     if (location.state?.center) {
//       setFormData(location.state.center);
//     }
//   }, [location.state]);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const existing =
//       JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

//     let updated;

//     if (formData.id) {
//       // EDIT
//       updated = existing.map((c) =>
//         c.id === formData.id ? formData : c
//       );
//     } else {
//       // ADD
//       updated = [
//         ...existing,
//         { ...formData, id: Date.now() }
//       ];
//     }

//     localStorage.setItem(
//       STORAGE_KEY,
//       JSON.stringify(updated)
//     );

//     navigate("/centers");
//   };

//   return (
//    <DashboardLayout> 
//   {/* <div className="bg-gray-100 min-h-screen p-8"> */}

//     <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">

//       <h1 className="text-xl font-semibold text-gray-800 mb-6">
//         {formData.id ? "Edit Center" : "Add Center"}
//       </h1>

//       <form onSubmit={handleSubmit} className="space-y-4">

//         <input
//           name="centerName"
//           placeholder="Center Name"
//           value={formData.centerName}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <input
//           name="location"
//           placeholder="Location"
//           value={formData.location}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <div className="grid grid-cols-2 gap-3">
//           <input
//             name="latitude"
//             placeholder="Latitude"
//             value={formData.latitude}
//             onChange={handleChange}
//             className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//             required
//           />

//           <input
//             name="longitude"
//             placeholder="Longitude"
//             value={formData.longitude}
//             onChange={handleChange}
//             className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//             required
//           />
//         </div>

//         <input
//           name="allowedRadius"
//           placeholder="Allowed Radius (meters)"
//           value={formData.allowedRadius}
//           onChange={handleChange}
//           className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//           required
//         />

//         <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition">
//           {formData.id ? "Update Center" : "Add Center"}
//         </button>

//       </form>
//     </div>
//   {/* </div> */}
//   </DashboardLayout>
// );

// };

// export default AddCenterForm;


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";

const AddCenterForm = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    latitude: "",
    longitude: "",
    allowed_radius: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("centers/create/", {
        name: formData.name,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        allowed_radius: parseInt(formData.allowed_radius)
      });

      navigate("/centers");

    } catch (error) {
      console.log(error.response?.data);
      alert("Error creating center");
    }
  };

  return (
    <DashboardLayout>

      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-xl font-semibold mb-6">
          Add Center
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            placeholder="Center Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="w-full p-2.5 border rounded-lg"
              required
            />

            <input
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="w-full p-2.5 border rounded-lg"
              required
            />
          </div>

          <input
            name="allowed_radius"
            placeholder="Allowed Radius (meters)"
            value={formData.allowed_radius}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <button className="w-full bg-green-600 text-white py-2.5 rounded-lg">
            Add Center
          </button>

        </form>

      </div>

    </DashboardLayout>
  );
};

export default AddCenterForm;


