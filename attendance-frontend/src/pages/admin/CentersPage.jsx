// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CenterTable from "../../components/tables/CenterTable";
// import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
// import DashboardLayout from "../../layouts/DashboardLayout";


// const STORAGE_KEY = "centers";

// const CentersPage = () => {
//   const [centers, setCenters] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const stored =
//       JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
//     setCenters(stored);
//   }, []);

//   const handleEdit = (center) => {
//     navigate("/add-center", {
//       state: { center }
//     });
//   };

//   const handleDeleteClick = (id) => {
//     setSelectedId(id);
//     setShowModal(true);
//   };

//   const confirmDelete = () => {
//     const updated = centers.filter(
//       (c) => c.id !== selectedId
//     );
//     setCenters(updated);
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     setShowModal(false);
//     setSelectedId(null);
//   };

//   return (
//     <DashboardLayout>
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">
//         Centers
//       </h1>

//       <CenterTable
//         centers={centers}
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
//     </DashboardLayout>
//   );
// };

// export default CentersPage;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenterTable from "../../components/tables/CenterTable";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";   // ✅ add this

const CentersPage = () => {
  const [centers, setCenters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const navigate = useNavigate();

  // ✅ Fetch centers from backend
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

  const handleEdit = (center) => {
    navigate("/add-center", {
      state: { center }
    });
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`centers/delete/${selectedId}/`);
      setCenters(centers.filter(c => c.id !== selectedId));
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
          Centers
        </h1>

        <CenterTable
          centers={centers}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
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

export default CentersPage;