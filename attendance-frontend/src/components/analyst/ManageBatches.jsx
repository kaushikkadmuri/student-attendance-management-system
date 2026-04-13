import AnalystLayout from "../../layouts/AnalystLayout";
import { useNavigate } from "react-router-dom";

const ManageBatches = () => {
  const navigate = useNavigate();

  return (
    <AnalystLayout>

      <h1 className="text-2xl font-semibold mb-6">
        Batch Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">

        {/* Add Batch */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">
            Add Batch
          </h2>

          <button
            onClick={() => navigate("/add-batch")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Batch
          </button>
        </div>

        {/* View Batches */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">
            View Batches
          </h2>

          <button
            onClick={() => navigate("/batches")}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
          >
            View Batches
          </button>
        </div>

      </div>

    </AnalystLayout>
  );
};

export default ManageBatches;
