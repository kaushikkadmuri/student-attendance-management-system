
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import AnalystLayout from "../../layouts/AnalystLayout";
// import api from "../../api/axios";

// const AddBatchForm = () => {

//   const navigate = useNavigate();

//   const [centerName, setCenterName] = useState("");

//   const [formData, setFormData] = useState({
//     name: "",
//     start_date: "",
//     end_date: ""
//   });

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const response = await api.get("auth/me/");
//         setCenterName(response.data.center);
//       } catch (error) {
//         console.log(error);
//       }
//     };

//     fetchUser();
//   }, []);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await api.post("batches/create/", {
//         name: formData.name,
//         start_date: formData.start_date,
//         end_date: formData.end_date
//       });

//       navigate("/batches");

//     } catch (error) {
//       console.log(error.response?.data);
//       alert("Error creating batch");
//     }
//   };

//   return (
//     <AnalystLayout>

//       <h1 className="text-xl font-bold mb-4">
//         Add Batch
//       </h1>

//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-6 rounded-xl shadow max-w-md space-y-4"
//       >

//         {/* Batch Name */}
//         <input
//           name="name"
//           placeholder="Batch Name"
//           value={formData.name}
//           onChange={handleChange}
//           className="w-full p-2 border rounded"
//           required
//         />

//         {/* Center Display (Read Only) */}
//         <input
//           value={centerName}
//           className="w-full p-2 border rounded bg-gray-100"
//           disabled
//         />

//         {/* Start Date */}
//         <input
//           type="date"
//           name="start_date"
//           value={formData.start_date}
//           onChange={handleChange}
//           className="w-full p-2 border rounded"
//           required
//         />

//         {/* End Date */}
//         <input
//           type="date"
//           name="end_date"
//           value={formData.end_date}
//           onChange={handleChange}
//           className="w-full p-2 border rounded"
//           required
//         />

//         <button className="bg-blue-600 text-white px-4 py-2 rounded">
//           Save Batch
//         </button>

//       </form>

//     </AnalystLayout>
//   );
// };

// export default AddBatchForm;


import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AnalystLayout from "../../layouts/AnalystLayout";
import api from "../../api/axios";

const AddBatchForm = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const editBatch = location.state?.batch || null;

  const [centerName, setCenterName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: ""
  });

  // ⭐ Load logged-in analyst center
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("auth/me/");
        setCenterName(response.data.center);
      } catch (error) {
        console.log(error);
      }
    };

    fetchUser();
  }, []);

  // ⭐ If Edit Mode → Pre-fill form
  useEffect(() => {
    if (editBatch) {
      setFormData({
        name: editBatch.name,
        start_date: editBatch.start_date,
        end_date: editBatch.end_date
      });
    }
  }, [editBatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ⭐ Date validation
    if (formData.end_date < formData.start_date) {
      alert("End date cannot be before start date");
      return;
    }

    try {

      if (editBatch) {
        // UPDATE
        await api.put(
          `batches/update/${editBatch.id}/`,
          formData
        );
        alert("Batch updated successfully");

      } else {
        // CREATE
        await api.post(
          "batches/create/",
          formData
        );
        alert("Batch created successfully");
      }

      navigate("/batches");

    } catch (error) {
      console.log(error.response?.data);
      alert("Error saving batch");
    }
  };

  return (
    <AnalystLayout>

      <h1 className="text-xl font-bold mb-4">
        {editBatch ? "Edit Batch" : "Add Batch"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow max-w-md space-y-4"
      >

        {/* Batch Name */}
        <input
          name="name"
          placeholder="Batch Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        {/* Center Display (Read Only) */}
        <input
          value={centerName}
          className="w-full p-2 border rounded bg-gray-100"
          disabled
        />

        {/* Start Date */}
        <input
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        {/* End Date */}
        <input
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          {editBatch ? "Update Batch" : "Save Batch"}
        </button>

      </form>

    </AnalystLayout>
  );
};

export default AddBatchForm;