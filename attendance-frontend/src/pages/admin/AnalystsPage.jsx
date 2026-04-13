// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AnalystTable from "../../components/tables/AnalystTable";
// import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
// import DashboardLayout from "../../layouts/DashboardLayout";


// const AnalystsPage = () => {
//   const [analysts, setAnalysts] = useState([]);
//   const navigate = useNavigate();

//   const [showModal, setShowModal] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);
//   const [showToast, setShowToast] = useState(false);

//   const handleDeleteClick = (id) => {
//   setSelectedId(id);
//   setShowModal(true);
//   };

//   const confirmDelete = () => {
//   const updated = analysts.filter((a) => a.id !== selectedId);
//   setAnalysts(updated);
//   localStorage.setItem("analysts", JSON.stringify(updated));

//   setShowModal(false);
//   setSelectedId(null);

//   setShowToast(true);
//   setTimeout(() => setShowToast(false), 3000);
// };


// const cancelDelete = () => {
//   setShowModal(false);
//   setSelectedId(null);
// };

// useEffect(() => {
//   const stored =
//     JSON.parse(localStorage.getItem("analysts")) || [];
//     setAnalysts(stored);
//   }, []);

//   // const handleDelete = (id) => {
//   //   const updated = analysts.filter((a) => a.id !== id);
//   //   setAnalysts(updated);
//   //   localStorage.setItem("analysts", JSON.stringify(updated));
//   // };

// //   const handleDelete = (id) => {
// //   const confirmDelete = window.confirm(
// //     "Are you sure you want to delete this analyst?"
// //   );

// //   if (!confirmDelete) return;

// //   const updated = analysts.filter((a) => a.id !== id);
// //   setAnalysts(updated);
// //   localStorage.setItem("analysts", JSON.stringify(updated));
// // };



//   const handleEdit = (analyst) => {
//     navigate("/add-analyst", {
//       state: { analyst }
//     });
//   };

//   return (
//     <DashboardLayout>
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">
//         Analysts
//       </h1>

//       <AnalystTable
//         analysts={analysts}
//         onEdit={handleEdit}
//         onDelete={handleDeleteClick}
//         disableActions={showModal}
//       />

//       <button
//         onClick={() => navigate("/admin")}
//         className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
//       >
//         Back to Dashboard
//       </button>
//       <ConfirmDeleteModal
//       isOpen={showModal}
//       onConfirm={confirmDelete}
//       onCancel={() => setShowModal(false)}
//       />
//     </div>
//     </DashboardLayout>
//   );
// };

// export default AnalystsPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalystTable from "../../components/tables/AnalystTable";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";

const AnalystsPage = () => {

  const [analysts, setAnalysts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  // 🔹 Fetch Analysts from DB
  const fetchAnalysts = async () => {
    try {
      const response = await api.get("auth/analysts/");
      setAnalysts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAnalysts();
  }, []);

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`auth/delete-analyst/${selectedId}/`);
      fetchAnalysts(); // refresh list
    } catch (error) {
      console.log(error);
    }

    setShowModal(false);
    setSelectedId(null);
  };

  const cancelDelete = () => {
    setShowModal(false);
    setSelectedId(null);
  };

  const handleEdit = (analyst) => {
    navigate("/add-analyst", {
      state: { analyst }
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">

        <h1 className="text-2xl font-bold mb-4">
          Analysts
        </h1>

        <AnalystTable
          analysts={analysts}
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
          onCancel={cancelDelete}
        />

      </div>
    </DashboardLayout>
  );
};

export default AnalystsPage;
