import DashboardLayout from "../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";

const ManageCenters = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Center Management
      </h1>

      <div className="bg-white p-6 rounded-xl shadow max-w-md">
        
        <p className="text-gray-500 mb-6">
          Add new centers and manage location configurations.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/add-center")}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
          >
            Add Center
          </button>

          <button
            onClick={() => navigate("/centers")}
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-lg transition"
          >
            View Centers
          </button>
        </div>

      </div>

    </DashboardLayout>
  );
};

export default ManageCenters;
