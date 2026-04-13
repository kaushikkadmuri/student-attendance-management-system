
// import { useEffect, useState } from "react";
// import CounsellorLayout from "../../layouts/CounsellorLayout";
// import AddStudentForm from "../../components/forms/AddStudentForm";
// import { useNavigate } from "react-router-dom";

// const StudentsPage = () => {
//   const navigate = useNavigate();

//   const loggedInUser =
//     JSON.parse(localStorage.getItem("loggedInUser")) || {};

//   const [batches, setBatches] = useState([]);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [students, setStudents] = useState([]);
//   const [viewMode, setViewMode] = useState("form"); // form | table
//   const [editingStudent, setEditingStudent] = useState(null);

//   // Load counsellor batches
//   useEffect(() => {
//     const allBatches =
//       JSON.parse(localStorage.getItem("batches")) || [];

//     const myBatches = allBatches.filter(
//       b => b.centerName === loggedInUser.assignedCenter
//     );

//     setBatches(myBatches);
//   }, []);

//   const loadStudents = () => {
//     if (!selectedBatch) return;

//     const allStudents =
//       JSON.parse(localStorage.getItem("students")) || [];

//     const batchStudents = allStudents.filter(
//       s =>
//         s.counsellorId === loggedInUser.id &&
//         s.batchCode === selectedBatch.batchCode
//     );

//     setStudents(batchStudents);
//   };

//   const handleBatchChange = (e) => {
//     const batch = batches.find(
//       b => b.batchCode === e.target.value
//     );
//     setSelectedBatch(batch);
//     setEditingStudent(null);
//     setViewMode("form");
//   };

//   const handleViewStudents = () => {
//     loadStudents();
//     setViewMode("table");
//   };

//   const handleDelete = (id) => {
//     if (!window.confirm("Delete this student?")) return;

//     const all =
//       JSON.parse(localStorage.getItem("students")) || [];

//     const updated = all.filter(s => s.id !== id);

//     localStorage.setItem("students", JSON.stringify(updated));
//     loadStudents();
//   };

//   const handleEdit = (student) => {
//     setEditingStudent(student);
//     setViewMode("form");
//   };

//   return (
//     <CounsellorLayout>

//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-semibold">
//           Manage Students
//         </h1>

//         <button
//           onClick={() => navigate("/counsellor-dashboard")}
//           className="bg-gray-600 text-white px-4 py-2 rounded"
//         >
//           Back to Dashboard
//         </button>
//       </div>

//       {/* Batch selector + View button */}
//       <div className="flex items-center gap-4 mb-6">
//         <select
//           className="p-2 border rounded"
//           value={selectedBatch?.batchCode || ""}
//           onChange={handleBatchChange}
//         >
//           <option value="">Select Batch</option>
//           {batches.map(batch => (
//             <option
//               key={batch.batchCode}
//               value={batch.batchCode}
//             >
//               {batch.batchCode} - {batch.batchName}
//             </option>
//           ))}
//         </select>

//         <button
//           onClick={handleViewStudents}
//           disabled={!selectedBatch}
//           className="bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
//         >
//           View Batch Students
//         </button>
//       </div>

//       {/* ADD / EDIT FORM */}
//       {selectedBatch && viewMode === "form" && (
//         <AddStudentForm
//           batchCode={selectedBatch.batchCode}
//           batchName={selectedBatch.batchName}
//           editingStudent={editingStudent}
//           onSave={(wasEdit) => {
//             setEditingStudent(null);
//             loadStudents();

//             if (wasEdit) {
//               setViewMode("table"); // 👈 KEY CHANGE
//             }
//           }}
//         />
//       )}

//       {/* STUDENTS TABLE */}
//       {selectedBatch && viewMode === "table" && (
//         <div className="bg-white rounded-xl shadow overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 text-left">Name</th>
//                 <th className="p-3 text-left">Mobile</th>
//                 <th className="p-3 text-left">Email</th>
//                 <th className="p-3 text-left">Password</th>
//                 <th className="p-3 text-left">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//         {students.length === 0 ? (
//           <tr>
//             <td colSpan="5" className="p-4 text-center">
//               No students in this batch
//             </td>
//           </tr>
//         ) : (
//           students.map(student => (
//             <tr key={student.id} className="border-t">

//         {/* STUDENT (PHOTO + NAME) */}
//         <td className="p-3 flex items-center gap-3">
//           {student.photo && (
//             <img
//               src={student.photo}
//               alt="profile"
//               className="w-8 h-8 rounded-full object-cover"
//             />
//           )}
//           <span>{student.studentName}</span>
//         </td>

//         {/* MOBILE */}
//         <td className="p-3">{student.mobile}</td>

//         {/* EMAIL */}
//         <td className="p-3">{student.email}</td>

//         {/* PASSWORD */}
//         <td className="p-3">{student.password}</td>

//         {/* ACTIONS */}
//         <td className="p-3 space-x-2">
//           <button
//             onClick={() => handleEdit(student)}
//             className="bg-blue-500 text-white px-3 py-1 rounded"
//           >
//             Edit
//           </button>

//           <button
//             onClick={() => handleDelete(student.id)}
//             className="bg-red-500 text-white px-3 py-1 rounded"
//           >
//             Delete
//           </button>
//         </td>

//       </tr>
//     ))
//   )}
// </tbody>

//           </table>
//         </div>
//       )}

//     </CounsellorLayout>
//   );
// };

// export default StudentsPage;


import { useEffect, useState } from "react";
import CounsellorLayout from "../../layouts/CounsellorLayout";
import AddStudentForm from "../../components/forms/AddStudentForm";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const StudentsPage = () => {

  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [viewMode, setViewMode] = useState("form");
  const [editingStudent, setEditingStudent] = useState(null);

  // 🔹 Load Batches
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await api.get("batches/list/");
        setBatches(res.data);
      } catch (error) {
        console.log(error.response?.data);
      }
    };

    loadBatches();
  }, []);

  // 🔹 Load Students
  const loadStudents = async () => {
    if (!selectedBatch) return;

    try {
      const res = await api.get(
        `students/list/?batch=${selectedBatch}`
      );
      setStudents(res.data);
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  const handleViewStudents = () => {
    loadStudents();
    setViewMode("table");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;

    try {
      await api.delete(`students/delete/${id}/`);
      loadStudents();
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setViewMode("form");
  };

  return (
    <CounsellorLayout>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">
          Manage Students
        </h1>

        <button
          onClick={() => navigate("/counsellor/dashboard")}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Batch Selector */}
      <div className="flex items-center gap-4 mb-6">
        <select
          className="p-2 border rounded"
          value={selectedBatch}
          onChange={(e) => {
            setSelectedBatch(e.target.value);
            setViewMode("form");
            setEditingStudent(null);
          }}
        >
          <option value="">Select Batch</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleViewStudents}
          disabled={!selectedBatch}
          className="bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          View Batch Students
        </button>
      </div>

      {/* Add/Edit Form */}
      {selectedBatch && viewMode === "form" && (
        <AddStudentForm
          batchId={selectedBatch}
          editingStudent={editingStudent}
          onSave={() => {
            setEditingStudent(null);
            loadStudents();
            setViewMode("table");
          }}
        />
      )}

      {/* Students Table */}
      {selectedBatch && viewMode === "table" && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Gender</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center">
                    No students in this batch
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className="border-t">

                    <td className="p-3 flex items-center gap-3">
                      {student.photo && (
                        <img
                          src={student.photo}
                          alt="profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span>{student.first_name}</span>
                    </td>

                    <td className="p-3">{student.gender}</td>
                    <td className="p-3">{student.mobile}</td>
                    <td className="p-3">{student.email}</td>

                    <td className="p-3">
                      {student.is_managed_by_me ? (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(student.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">
                          Managed by {student.counsellor_name || "another counsellor"}
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </CounsellorLayout>
  );
};

export default StudentsPage;
