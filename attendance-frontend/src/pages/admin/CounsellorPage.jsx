// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CounsellorTable from "../../components/tables/CounsellorTable";
// import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
// import DashboardLayout from "../../layouts/DashboardLayout";


// const STORAGE_KEY = "counsellors";

// const CounsellorsPage = () => {
//   const [counsellors, setCounsellors] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const stored =
//       JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
//     setCounsellors(stored);
//   }, []);

//   const handleEdit = (counsellor) => {
//     navigate("/add-counsellor", {
//       state: { counsellor }
//     });
//   };

//   const handleDeleteClick = (id) => {
//     setSelectedId(id);
//     setShowModal(true);
//   };

//   const confirmDelete = () => {
//     const updated = counsellors.filter(
//       (c) => c.id !== selectedId
//     );
//     setCounsellors(updated);
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     setShowModal(false);
//     setSelectedId(null);
//   };

//   return (
//     <DashboardLayout>
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">
//         Counsellors
//       </h1>

//       <CounsellorTable
//         counsellors={counsellors}
//         onEdit={handleEdit}
//         onDelete={handleDeleteClick}
//       />

//       <button
//         onClick={() => navigate("/admin/dashboard")}
//         className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
//       >
//         Back to Dashboard
//       </button>

//       <ConfirmDeleteModal
//         isOpen={showModal}
//         onConfirm={confirmDelete}
//         onCancel={() => setShowModal(false)}
//       />
//     </div>
//      </DashboardLayout> 
//   );
// };

// export default CounsellorsPage;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CounsellorTable from "../../components/tables/CounsellorTable";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";

const CounsellorsPage = () => {
  const [counsellors, setCounsellors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const navigate = useNavigate();

  // ✅ Fetch from backend
  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        const response = await api.get("auth/counsellors/");
        setCounsellors(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCounsellors();
  }, []);

  const handleEdit = (counsellor) => {
    navigate("/add-counsellor", {
      state: { counsellor }
    });
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`auth/delete-counsellor/${selectedId}/`);

      setCounsellors(
        counsellors.filter(c => c.id !== selectedId)
      );

    } catch (error) {
      console.log(error);
    }

    setShowModal(false);
    setSelectedId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Counsellors
        </h1>

        <CounsellorTable
          counsellors={counsellors}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          disableActions={showModal}
        />

        <button
          onClick={() => navigate("/admin/dashboard")}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>

        <ConfirmDeleteModal
          isOpen={showModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowModal(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CounsellorsPage;
