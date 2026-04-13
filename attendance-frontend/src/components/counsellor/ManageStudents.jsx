// import { useEffect, useState } from "react";
// import AddStudentForm from "../forms/AddStudentForm";
// import StudentsTable from "../tables/StudentsTable";

// const ManageStudents = () => {
//   const loggedInUser =
//     JSON.parse(localStorage.getItem("loggedInUser")) || {};

//   const [batches, setBatches] = useState([]);
//   const [selectedBatchId, setSelectedBatchId] = useState("");
//   const [students, setStudents] = useState([]);

//   // Load batches assigned to this counsellor
//   useEffect(() => {
//     const allBatches =
//       JSON.parse(localStorage.getItem("batches")) || [];

//     const counsellorBatches = allBatches.filter(
//       (batch) => batch.counsellorId === loggedInUser.id
//     );

//     setBatches(counsellorBatches);
//   }, []);

//   // Load students for selected batch
//   useEffect(() => {
//     if (!selectedBatchId) return;

//     const allStudents =
//       JSON.parse(localStorage.getItem("students")) || [];

//     const batchStudents = allStudents.filter(
//       (student) => student.batchId === selectedBatchId
//     );

//     setStudents(batchStudents);
//   }, [selectedBatchId]);

//   const refreshStudents = () => {
//     const allStudents =
//       JSON.parse(localStorage.getItem("students")) || [];

//     setStudents(
//       allStudents.filter(
//         (student) => student.batchId === selectedBatchId
//       )
//     );
//   };

//   return (
//     <div>
//       <h2>Manage Students</h2>

//       {/* Batch selector */}
//       <select
//         value={selectedBatchId}
//         onChange={(e) => setSelectedBatchId(e.target.value)}
//       >
//         <option value="">Select Batch</option>
//         {batches.map((batch) => (
//           <option key={batch.id} value={batch.id}>
//             {batch.name}
//           </option>
//         ))}
//       </select>

//       {/* Show only after batch selection */}
//       {selectedBatchId && (
//         <>
//           <AddStudentForm
//             batchId={selectedBatchId}
//             onStudentAdded={refreshStudents}
//           />

//           <StudentsTable students={students} />
//         </>
//       )}
//     </div>
//   );
// };

// export default ManageStudents;


import { useEffect, useState } from "react";
import AddStudentForm from "../forms/AddStudentForm";

const ManageStudents = () => {
  const loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser")) || {};

  const [batches, setBatches] = useState([]);
  const [selectedBatchCode, setSelectedBatchCode] = useState("");
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);

  // Load counsellor batches
  useEffect(() => {
    const allBatches =
      JSON.parse(localStorage.getItem("batches")) || [];

    const myBatches = allBatches.filter(
      b => b.centerName === loggedInUser.assignedCenter
    );

    setBatches(myBatches);
  }, []);

  // Load students for selected batch
  const loadStudents = () => {
    const allStudents =
      JSON.parse(localStorage.getItem("students")) || [];

    const batchStudents = allStudents.filter(
      s =>
        s.counsellorId === loggedInUser.id &&
        s.batchCode === selectedBatchCode
    );

    setStudents(batchStudents);
  };

  useEffect(() => {
    if (selectedBatchCode) {
      loadStudents();
    }
  }, [selectedBatchCode]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this student?")) return;

    const all =
      JSON.parse(localStorage.getItem("students")) || [];

    const updated = all.filter(s => s.id !== id);

    localStorage.setItem("students", JSON.stringify(updated));
    loadStudents();
  };

  const selectedBatch = batches.find(
    b => b.batchCode === selectedBatchCode
  );

  return (
    <div>

      {/* Batch Selector */}
      <select
        className="mb-4 p-2 border rounded"
        value={selectedBatchCode}
        onChange={(e) => {
          setSelectedBatchCode(e.target.value);
          setEditingStudent(null);
        }}
      >
        <option value="">Select Batch</option>
        {batches.map(batch => (
          <option key={batch.batchCode} value={batch.batchCode}>
            {batch.batchCode} - {batch.batchName}
          </option>
        ))}
      </select>

      {/* Only show after batch selection */}
      {selectedBatchCode && (
        <>
          <AddStudentForm
            batchCode={selectedBatch.batchCode}
            batchName={selectedBatch.batchName}
            editingStudent={editingStudent}
            onSave={loadStudents}
          />

          <table className="w-full mt-6 bg-white rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center">
                    No students in this batch
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className="border-t">
                    <td className="p-3">{student.studentName}</td>
                    <td className="p-3">{student.mobile}</td>
                    <td className="p-3">{student.email}</td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => setEditingStudent(student)}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ManageStudents;
