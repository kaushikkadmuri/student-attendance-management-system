
// import { useState, useEffect } from "react";
// import CameraModal from "../modals/CameraModal";

// const AddStudentForm = ({
//   batchCode,
//   batchName,
//   editingStudent,
//   onSave
// }) => {
//   const loggedInUser =
//     JSON.parse(localStorage.getItem("loggedInUser")) || {};

//   // =====================
//   // STATE
//   // =====================
//   const [showCamera, setShowCamera] = useState(false);
//   const [photo, setPhoto] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");

//   const [formData, setFormData] = useState({
//     id: null,
//     studentName: "",
//     mobile: "",
//     email: "",
//     password: ""
//   });

//   // =====================
//   // PREFILL ON EDIT
//   // =====================
//   useEffect(() => {
//     if (editingStudent) {
//       setFormData({
//         id: editingStudent.id,
//         studentName: editingStudent.studentName,
//         mobile: editingStudent.mobile,
//         email: editingStudent.email,
//         password: editingStudent.password
//       });
//       setPhoto(editingStudent.photo || null);
//       setSuccessMessage("");
//     } else {
//       setFormData({
//         id: null,
//         studentName: "",
//         mobile: "",
//         email: "",
//         password: ""
//       });
//       setPhoto(null);
//       setSuccessMessage("");
//     }
//   }, [editingStudent]);

//   // =====================
//   // HANDLERS
//   // =====================
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const students =
//       JSON.parse(localStorage.getItem("students")) || [];

//     const isEdit = !!formData.id;
//     let updated;

//     if (isEdit) {
//       // UPDATE
//       updated = students.map(s =>
//         s.id === formData.id
//           ? {
//               ...s,
//               ...formData,
//               photo,
//               batchCode,
//               batchName
//             }
//           : s
//       );
//     } else {
//       // ADD
//       updated = [
//         ...students,
//         {
//           ...formData,
//           id: Date.now(),
//           photo,
//           batchCode,
//           batchName,
//           counsellorId: loggedInUser.id,
//           centerName: loggedInUser.assignedCenter
//         }
//       ];
//     }

//     localStorage.setItem("students", JSON.stringify(updated));

//     // ✅ AFTER ADD: clear form + show message
//     if (!isEdit) {
//       setFormData({
//         id: null,
//         studentName: "",
//         mobile: "",
//         email: "",
//         password: ""
//       });
//       setPhoto(null);
//       setSuccessMessage("Student added successfully ✅");

//       setTimeout(() => {
//         setSuccessMessage("");
//       }, 2000);
//     }

//     // tell parent (edit → switch to table)
//     onSave(isEdit);
//   };

//   // =====================
//   // JSX
//   // =====================
//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white p-6 rounded-xl shadow max-w-md space-y-4"
//     >
//       <h2 className="text-lg font-semibold">
//         {formData.id ? "Edit Student" : "Add Student"}{" "}
//         <span className="text-sm text-gray-500">
//           ({batchName})
//         </span>
//       </h2>

//       {/* SUCCESS MESSAGE */}
//       {successMessage && (
//         <div className="bg-green-100 text-green-700 p-2 rounded text-sm">
//           {successMessage}
//         </div>
//       )}

//       {/* ================= PHOTO SECTION ================= */}
//       <div className="space-y-2">
//         {!photo && (
//           <button
//             type="button"
//             onClick={() => setShowCamera(true)}
//             className="bg-gray-700 text-white px-4 py-2 rounded"
//           >
//             Open Camera
//           </button>
//         )}

//         {photo && (
//           <div className="flex items-center gap-4">
//             <img
//               src={photo}
//               alt="Student"
//               className="w-16 h-16 rounded-full object-cover"
//             />
//             <button
//               type="button"
//               onClick={() => setShowCamera(true)}
//               className="bg-yellow-600 text-white px-3 py-1 rounded"
//             >
//               Retake
//             </button>
//           </div>
//         )}
//       </div>

//       {/* CAMERA MODAL */}
//       {showCamera && (
//         <CameraModal
//           onCapture={(img) => {
//             setPhoto(img);
//             setShowCamera(false);
//           }}
//           onClose={() => setShowCamera(false)}
//         />
//       )}

//       {/* ================= FORM FIELDS ================= */}
//       <input
//         name="studentName"
//         placeholder="Student Name"
//         value={formData.studentName}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       />

//       <input
//         name="mobile"
//         placeholder="Mobile"
//         value={formData.mobile}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       />

//       <input
//         name="email"
//         type="email"
//         placeholder="Email"
//         value={formData.email}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       />

//       {/* PASSWORD WITH TOGGLE */}
//       <div className="relative">
//         <input
//           name="password"
//           type={showPassword ? "text" : "password"}
//           placeholder="Password"
//           value={formData.password}
//           onChange={handleChange}
//           className="w-full p-2 border rounded pr-12"
//           required
//         />
//         <button
//           type="button"
//           onClick={() => setShowPassword(p => !p)}
//           className="absolute right-3 top-2 text-sm text-blue-600"
//         >
//           {showPassword ? "Hide" : "Show"}
//         </button>
//       </div>

//       <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
//         {formData.id ? "Update Student" : "Save Student"}
//       </button>
//     </form>
//   );
// };

// export default AddStudentForm;

// import { useState } from "react";
// import CameraModal from "../modals/CameraModal";
// import api from "../../api/axios";

// const AddStudentForm = ({ batchId, onSave }) => {

//   const [showCamera, setShowCamera] = useState(false);
//   const [photo, setPhoto] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");

//   const [formData, setFormData] = useState({
//     first_name: "",
//     mobile: "",
//     email: "",
//     password: "",
//     gender: ""
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await api.post("students/create/", {
//         ...formData,
//         batch: batchId,
//         photo
//       });

//       setSuccessMessage("Student added successfully ✅");

//       setFormData({
//         first_name: "",
//         mobile: "",
//         email: "",
//         password: "",
//         gender: ""
//       });

//       setPhoto(null);

//       setTimeout(() => {
//         setSuccessMessage("");
//         onSave();
//       }, 1500);

//     } catch (error) {
//       console.log(error.response?.data);
//       alert("Error creating student");
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white p-6 rounded-xl shadow max-w-md space-y-4"
//     >
//       <h2 className="text-lg font-semibold">
//         Add Student
//       </h2>

//       {successMessage && (
//         <div className="bg-green-100 text-green-700 p-2 rounded text-sm">
//           {successMessage}
//         </div>
//       )}

//       {/* PHOTO */}
//       <div className="space-y-2">
//         {!photo && (
//           <button
//             type="button"
//             onClick={() => setShowCamera(true)}
//             className="bg-gray-700 text-white px-4 py-2 rounded"
//           >
//             Open Camera
//           </button>
//         )}

//         {photo && (
//           <div className="flex items-center gap-4">
//             <img
//               src={photo}
//               alt="Student"
//               className="w-16 h-16 rounded-full object-cover"
//             />
//             <button
//               type="button"
//               onClick={() => setShowCamera(true)}
//               className="bg-yellow-600 text-white px-3 py-1 rounded"
//             >
//               Retake
//             </button>
//           </div>
//         )}
//       </div>

//       {showCamera && (
//         <CameraModal
//           onCapture={(img) => {
//             setPhoto(img);
//             setShowCamera(false);
//           }}
//           onClose={() => setShowCamera(false)}
//         />
//       )}

//       <input
//         name="first_name"
//         placeholder="Student Name"
//         value={formData.first_name}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       />

//       <input
//         name="mobile"
//         placeholder="Mobile"
//         value={formData.mobile}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       />

//       <input
//         name="email"
//         type="email"
//         placeholder="Email"
//         value={formData.email}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       />

//       <select
//         name="gender"
//         value={formData.gender}
//         onChange={handleChange}
//         className="w-full p-2 border rounded"
//         required
//       >
//         <option value="">Select Gender</option>
//         <option value="MALE">Male</option>
//         <option value="FEMALE">Female</option>
//         <option value="OTHER">Other</option>
//       </select>

//       <div className="relative">
//         <input
//           name="password"
//           type={showPassword ? "text" : "password"}
//           placeholder="Password"
//           value={formData.password}
//           onChange={handleChange}
//           className="w-full p-2 border rounded pr-12"
//           required
//         />
//         <button
//           type="button"
//           onClick={() => setShowPassword(p => !p)}
//           className="absolute right-3 top-2 text-sm text-blue-600"
//         >
//           {showPassword ? "Hide" : "Show"}
//         </button>
//       </div>

//       <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
//         Save Student
//       </button>
//     </form>
//   );
// };

// export default AddStudentForm;


import { useState, useEffect } from "react";
import CameraModal from "../modals/CameraModal";
import api from "../../api/axios";

const AddStudentForm = ({ batchId, editingStudent, onSave }) => {

  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    mobile: "",
    email: "",
    password: "",
    gender: ""
  });

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        first_name: editingStudent.first_name,
        mobile: editingStudent.mobile,
        email: editingStudent.email,
        password: "",
        gender: editingStudent.gender
      });
      setPhoto(editingStudent.photo);
    } else {
      setPhoto(null);
    }
  }, [editingStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        await api.put(
          `students/update/${editingStudent.id}/`,
          {
            ...formData,
            batch: batchId,
            photo,
          }
        );
      } else {
        await api.post("students/create/", {
          ...formData,
          batch: batchId,
          photo,
        });
      }

      setSuccessMessage("Student saved successfully ✅");

      setTimeout(() => {
        setSuccessMessage("");
        onSave();
      }, 1200);

    } catch (error) {
      console.log(error.response?.data);
      alert("Error saving student");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow max-w-md space-y-4"
    >
      <h2 className="text-lg font-semibold">
        {editingStudent ? "Edit Student" : "Add Student"}
      </h2>

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-2 rounded text-sm">
          {successMessage}
        </div>
      )}

      {/* PHOTO */}
      <div className="space-y-2">
        {!photo && (
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Open Camera
          </button>
        )}

        {photo && (
          <div className="flex items-center gap-4">
            <img
              src={photo}
              alt="Student"
              className="w-16 h-16 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="bg-yellow-600 text-white px-3 py-1 rounded"
            >
              Retake
            </button>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraModal
          title="Student Photo Capture"
          description="Capture a clear student profile photo with one face in frame and good lighting."
          onCapture={(capturedPhoto) => {
            const nextPhoto =
              typeof capturedPhoto === "string"
                ? capturedPhoto
                : capturedPhoto?.selfie_image;
            setPhoto(nextPhoto);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <input
        name="first_name"
        placeholder="Student Name"
        value={formData.first_name}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">Select Gender</option>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
      </select>

      <input
        name="mobile"
        placeholder="Mobile"
        value={formData.mobile}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <div className="relative">
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword(p => !p)}
          className="absolute right-3 top-2 text-sm text-blue-600"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
        {editingStudent ? "Update Student" : "Save Student"}
      </button>
    </form>
  );
};

export default AddStudentForm;
