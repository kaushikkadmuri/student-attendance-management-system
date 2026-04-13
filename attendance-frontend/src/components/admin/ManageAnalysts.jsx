import DashboardLayout from "../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";

const ManageAnalysts = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Analyst Management
      </h1>

      <div className="bg-white p-6 rounded-xl shadow max-w-md">
        
        <p className="text-gray-500 mb-6">
          Add new analysts or manage existing analyst records.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/add-analyst")}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
          >
            Add Analyst
          </button>

          <button
            onClick={() => navigate("/analysts")}
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-lg transition"
          >
            View Analysts
          </button>
        </div>

      </div>

    </DashboardLayout>
  );
};

export default ManageAnalysts;
