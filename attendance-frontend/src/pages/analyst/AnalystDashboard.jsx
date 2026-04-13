import { useEffect, useState } from "react";
import AnalystLayout from "../../layouts/AnalystLayout";
import api from "../../api/axios";

const AnalystDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myBatches, setMyBatches] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [ongoingBatches, setOngoingBatches] = useState([]);
  const [completedBatches, setCompletedBatches] = useState([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("batches/list/");
        const data = Array.isArray(response.data) ? response.data : [];

        setMyBatches(data);

        const sorted = [...data].sort((a, b) => b.id - a.id);
        setRecentBatches(sorted.slice(0, 5));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parsed = data.map((batch) => {
          const startDate = new Date(batch.start_date);
          const endDate = new Date(batch.end_date);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          return { ...batch, _startDate: startDate, _endDate: endDate };
        });

        const ongoing = parsed.filter(
          (batch) => batch._startDate <= today && batch._endDate >= today
        );
        const completed = parsed.filter((batch) => batch._endDate < today);

        setOngoingBatches(ongoing.sort((a, b) => b.id - a.id));
        setCompletedBatches(completed.sort((a, b) => b.id - a.id));
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  return (
    <AnalystLayout>
      <h1 className="text-2xl font-semibold mb-6">Analyst Dashboard</h1>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Total Batches</h2>
          <p className="text-3xl font-bold">{myBatches.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Ongoing Batches</h2>
          <p className="text-3xl font-bold">{ongoingBatches.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Completed Batches</h2>
          <p className="text-3xl font-bold">{completedBatches.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Ongoing Batches</h2>
          {loading ? (
            <p className="text-gray-500">Loading batches...</p>
          ) : ongoingBatches.length === 0 ? (
            <p className="text-gray-500">No ongoing batches</p>
          ) : (
            <div className="space-y-3">
              {ongoingBatches.slice(0, 5).map((batch) => (
                <div key={batch.id} className="border rounded-lg p-3 flex justify-between">
                  <div>
                    <p className="font-medium">{batch.name}</p>
                    <p className="text-sm text-gray-500">{batch.center}</p>
                  </div>

                  <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full h-fit">
                    Ongoing
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Completed Batches</h2>
          {loading ? (
            <p className="text-gray-500">Loading batches...</p>
          ) : completedBatches.length === 0 ? (
            <p className="text-gray-500">No completed batches</p>
          ) : (
            <div className="space-y-3">
              {completedBatches.slice(0, 5).map((batch) => (
                <div key={batch.id} className="border rounded-lg p-3 flex justify-between">
                  <div>
                    <p className="font-medium">{batch.name}</p>
                    <p className="text-sm text-gray-500">{batch.center}</p>
                  </div>

                  <div className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full h-fit">
                    Completed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Batches</h2>

        {loading ? (
          <p className="text-gray-500">Loading batches...</p>
        ) : recentBatches.length === 0 ? (
          <p className="text-gray-500">No recent batches</p>
        ) : (
          <div className="space-y-3">
            {recentBatches.map((batch) => (
              <div key={batch.id} className="border rounded-lg p-3 flex justify-between">
                <div>
                  <p className="font-medium">{batch.name}</p>
                  <p className="text-sm text-gray-500">{batch.center}</p>
                </div>

                <div className="text-sm text-gray-400">{batch.start_date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnalystLayout>
  );
};

export default AnalystDashboard;
