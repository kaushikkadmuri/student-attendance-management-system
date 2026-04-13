// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AnalystLayout from "../../layouts/AnalystLayout";

// const BatchesPage = () => {

//   const [batches, setBatches] = useState([]);
//   const navigate = useNavigate();

//   const loggedInUser =
//     JSON.parse(localStorage.getItem("loggedInUser")) || {};

//   // ⭐ Load Analyst Batches
//   const loadBatches = () => {

//     const stored =
//       JSON.parse(localStorage.getItem("batches")) || [];

//     const myBatches = stored.filter(
//       (b) => b.analystId === loggedInUser?.id
//     );

//     // ⭐ Sort newest first
//     setBatches(myBatches.sort((a, b) => b.id - a.id));
//   };

//   // ⭐ STATUS LOGIC (Correct Priority Order)
//   const getStatus = (batch) => {

//     const today = new Date();
//     const start = new Date(batch.startDate);
//     const end = new Date(batch.endDate);

//     if (end < today) return "Completed";

//     const diffDays =
//       (end - today) / (1000 * 60 * 60 * 24);

//     if (diffDays >= 0 && diffDays <= 7)
//       return "Ending Soon";

//     if (start <= today && end >= today)
//       return "Active";

//     return "Upcoming";
//   };

//   // ⭐ STATUS COLOR
//   const getStatusColor = (status) => {

//     if (status === "Active")
//       return "bg-green-100 text-green-700";

//     if (status === "Completed")
//       return "bg-gray-200 text-gray-700";

//     if (status === "Ending Soon")
//       return "bg-red-100 text-red-600";

//     return "bg-blue-100 text-blue-700";
//   };

//   useEffect(() => {

//     loadBatches();

//     const handleStorageChange = () => loadBatches();

//     window.addEventListener("storage", handleStorageChange);

//     return () =>
//       window.removeEventListener("storage", handleStorageChange);

//   }, []);

//   // ⭐ DELETE
//   const handleDelete = (id) => {

//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this batch?"
//     );

//     if (!confirmDelete) return;

//     const all =
//       JSON.parse(localStorage.getItem("batches")) || [];

//     const updated = all.filter(b => b.id !== id);

//     localStorage.setItem(
//       "batches",
//       JSON.stringify(updated)
//     );

//     window.dispatchEvent(new Event("storage"));
//   };

//   // ⭐ EDIT
//   const handleEdit = (batch) => {
//     navigate("/add-batch", {
//       state: { batch }
//     });
//   };

//   return (
//     <AnalystLayout>

//       <h1 className="text-2xl font-semibold mb-6">
//         My Batches
//       </h1>

//       <div className="bg-white rounded-xl shadow overflow-hidden">
//         <table className="w-full">

//           <thead className="bg-gray-100">
//             <tr>
//               <th className="p-3 text-left">Batch Name</th>
//               <th className="p-3 text-left">Batch Code</th>
//               <th className="p-3 text-left">Center</th>
//               <th className="p-3 text-left">Start Date</th>
//               <th className="p-3 text-left">End Date</th>
//               <th className="p-3 text-left">Status</th>
//               <th className="p-3 text-left">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {batches.length === 0 ? (
//               <tr>
//                 <td colSpan="7" className="p-4 text-center">
//                   No batches found
//                 </td>
//               </tr>
//             ) : (
//               batches.map((batch) => {

//                 const status = getStatus(batch);

//                 return (
//                   <tr key={batch.id} className="border-t">

//                     <td className="p-3">{batch.batchName}</td>
//                     <td className="p-3">{batch.batchCode}</td>
//                     <td className="p-3">{batch.centerName}</td>
//                     <td className="p-3">{batch.startDate}</td>
//                     <td className="p-3">{batch.endDate}</td>

//                     {/* STATUS BADGE */}
//                     <td className="p-3">
//                       <span
//                         className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
//                       >
//                         {status}
//                       </span>
//                     </td>

//                     {/* ACTIONS */}
//                     <td className="p-3 space-x-2">

//                       <button
//                         onClick={() => handleEdit(batch)}
//                         className="bg-blue-500 text-white px-3 py-1 rounded"
//                       >
//                         Edit
//                       </button>

//                       <button
//                         onClick={() => handleDelete(batch.id)}
//                         className="bg-red-500 text-white px-3 py-1 rounded"
//                       >
//                         Delete
//                       </button>

//                     </td>

//                   </tr>
//                 );
//               })
//             )}
//           </tbody>

//         </table>
//       </div>

//     </AnalystLayout>
//   );
// };

// export default BatchesPage;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalystLayout from "../../layouts/AnalystLayout";
import api from "../../api/axios";

const BatchesPage = () => {

  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  // ⭐ LOAD FROM BACKEND
  const loadBatches = async () => {
  try {
    const res = await api.get("batches/list/");
    setBatches(res.data);
  } catch (error) {
    console.error("Error loading batches", error.response?.data);
  }
};

  // ⭐ STATUS LOGIC
  const getStatus = (batch) => {

    const today = new Date();
    const start = new Date(batch.start_date);
    const end = new Date(batch.end_date);

    if (end < today) return "Completed";

    const diffDays =
      (end - today) / (1000 * 60 * 60 * 24);

    if (diffDays >= 0 && diffDays <= 7)
      return "Ending Soon";

    if (start <= today && end >= today)
      return "Active";

    return "Upcoming";
  };

  const getStatusColor = (status) => {

    if (status === "Active")
      return "bg-green-100 text-green-700";

    if (status === "Completed")
      return "bg-gray-200 text-gray-700";

    if (status === "Ending Soon")
      return "bg-red-100 text-red-600";

    return "bg-blue-100 text-blue-700";
  };

  useEffect(() => {
    loadBatches();
  }, []);

  // ⭐ DELETE FROM BACKEND
  const handleDelete = async (id) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this batch?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`batches/delete/${id}/`);
    loadBatches();
  } catch (error) {
    console.error("Error deleting batch", error.response?.data);
  }
};

  // ⭐ EDIT
  const handleEdit = (batch) => {
    navigate("/add-batch", {
      state: { batch }
    });
  };

  return (
    <AnalystLayout>

      <h1 className="text-2xl font-semibold mb-6">
        My Batches
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Batch Name</th>
              <th className="p-3 text-left">Center</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">End Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center">
                  No batches found
                </td>
              </tr>
            ) : (
              batches.map((batch) => {

                const status = getStatus(batch);

                return (
                  <tr key={batch.id} className="border-t">

                    <td className="p-3">{batch.name}</td>
                    <td className="p-3">{batch.center}</td>
                    <td className="p-3">{batch.start_date}</td>
                    <td className="p-3">{batch.end_date}</td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-3 space-x-2">

                      <button
                        onClick={() => handleEdit(batch)}
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

    </AnalystLayout>
  );
};

export default BatchesPage;