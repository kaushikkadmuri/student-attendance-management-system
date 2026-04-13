import CounsellorLayout from "../../layouts/CounsellorLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CounsellorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [centerBatches, setCenterBatches] = useState([]);
  const [managedStudentCountByBatch, setManagedStudentCountByBatch] = useState({});
  const [totalStudentCountByBatch, setTotalStudentCountByBatch] = useState({});

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const [meRes, batchRes] = await Promise.all([
          api.get("auth/me/"),
          api.get("batches/list/"),
        ]);

        const me = meRes.data || null;
        const batchList = Array.isArray(batchRes.data) ? batchRes.data : [];
        setUser(me);
        setCenterBatches(batchList);

        const countEntries = await Promise.all(
          batchList.map(async (batch) => {
            try {
              const studentsRes = await api.get(`students/list/?batch=${batch.id}`);
              const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
              const managedStudents = students.filter(
                (student) => student.is_managed_by_me
              );
              return {
                batchId: batch.id,
                managedCount: managedStudents.length,
                totalCount: students.length,
              };
            } catch {
              return {
                batchId: batch.id,
                managedCount: 0,
                totalCount: 0,
              };
            }
          })
        );
        setManagedStudentCountByBatch(
          Object.fromEntries(countEntries.map((entry) => [entry.batchId, entry.managedCount]))
        );
        setTotalStudentCountByBatch(
          Object.fromEntries(countEntries.map((entry) => [entry.batchId, entry.totalCount]))
        );
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalStudents = Object.values(managedStudentCountByBatch).reduce(
    (sum, count) => sum + count,
    0
  );
  const recentBatches = [...centerBatches].sort((a, b) => b.id - a.id).slice(0, 5);
  const centerLabel = (user?.center || "Center").trim();

  return (
    <CounsellorLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Counsellor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome {user?.first_name || user?.email || "Counsellor"}. Add and manage students in
            center batches created by analysts.
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Assigned Center</p>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {user?.center || "No Center"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Center Batches</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{centerBatches.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Students Managed</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            <button
              onClick={() => navigate("/counsellor/students")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Open Student Manager
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent {centerLabel} Batches
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading dashboard data...</p>
          ) : recentBatches.length === 0 ? (
            <p className="text-gray-500">No batches available.</p>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{batch.name}</p>
                    <p className="text-sm text-gray-500">
                      {batch.start_date} to {batch.end_date}
                    </p>
                  </div>
                  <div className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {totalStudentCountByBatch[batch.id] || 0} students
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CounsellorLayout>
  );
};

export default CounsellorDashboard;
