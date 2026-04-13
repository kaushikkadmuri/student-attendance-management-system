import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";

const AdminHome = () => {
  const [summary, setSummary] = useState({
    counts: {
      centers: 0,
      analysts: 0,
      counsellors: 0,
      students: 0,
    },
  });
  const [activities, setActivities] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchReport, setBatchReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityActionLoading, setActivityActionLoading] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  const emptySummary = {
    counts: {
      centers: 0,
      analysts: 0,
      counsellors: 0,
      students: 0,
    },
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [summaryRes, activityRes] = await Promise.all([
          api.get("audit-logs/summary/"),
          api.get("audit-logs/activities/?limit=20"),
        ]);

        setSummary(summaryRes.data || emptySummary);
        setActivities(activityRes.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load admin dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const reloadRecentActivity = async () => {
    const [summaryRes, activityRes] = await Promise.all([
      api.get("audit-logs/summary/"),
      api.get("audit-logs/activities/?limit=20"),
    ]);

    setSummary(summaryRes.data || emptySummary);
    setActivities(activityRes.data || []);
  };

  useEffect(() => {
    const loadCenters = async () => {
      try {
        const res = await api.get("centers/");
        const centerList = Array.isArray(res.data) ? res.data : [];
        setCenters(centerList);
        if (centerList.length > 0) {
          setSelectedCenterId(String(centerList[0].id));
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load centers.");
      }
    };

    loadCenters();
  }, []);

  useEffect(() => {
    const loadBatches = async () => {
      if (!selectedCenterId) {
        setBatches([]);
        setSelectedBatchId("");
        return;
      }
      try {
        const res = await api.get(`batches/list/?center_id=${selectedCenterId}`);
        const batchList = Array.isArray(res.data) ? res.data : [];
        setBatches(batchList);
        if (batchList.length > 0) {
          setSelectedBatchId(String(batchList[0].id));
        } else {
          setSelectedBatchId("");
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load batches.");
      }
    };

    loadBatches();
  }, [selectedCenterId]);

  useEffect(() => {
    const loadBatchAttendance = async () => {
      if (!selectedBatchId) {
        setBatchReport(null);
        return;
      }
      try {
        setReportLoading(true);
        const res = await api.get(`audit-logs/batch-attendance/?batch_id=${selectedBatchId}`);
        setBatchReport(res.data || null);
      } catch (err) {
        setBatchReport(null);
        setError(err?.response?.data?.error || "Unable to load batch attendance.");
      } finally {
        setReportLoading(false);
      }
    };

    loadBatchAttendance();
  }, [selectedBatchId]);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const badgeClass = (status) => {
    if (status === "SUCCESS") return "bg-green-100 text-green-700";
    if (status === "FAILED") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getPerformedForParts = (entry) => {
    const targetEmail = entry.target_email || "";
    const targetName = entry.target_name || "";
    const targetRole = entry.target_role || "";

    if (targetEmail || targetName || targetRole) {
      return {
        primary: targetEmail || targetName || "-",
        secondary: targetRole || "-",
      };
    }

    const display = (entry.target_display || "").trim();
    if (!display || display === "-") {
      return { primary: "-", secondary: "-" };
    }

    // Fallback for legacy rows like: "Counsellor: Name (email@x.com)"
    const roleSplit = display.match(/^([^:]+):\s*(.+)$/);
    if (roleSplit) {
      const role = roleSplit[1].trim().toUpperCase();
      const rest = roleSplit[2].trim();
      const emailMatch = rest.match(/\(([^)\s]+@[^)\s]+)\)\s*$/);
      return {
        primary: emailMatch ? emailMatch[1].trim() : rest,
        secondary: role || "-",
      };
    }

    return { primary: display, secondary: "-" };
  };

  const handleClearAllActivities = async () => {
    const confirmed = window.confirm(
      "Clear all audit logs? This will permanently remove every audit log entry."
    );

    if (!confirmed) return;

    try {
      setActivityActionLoading("clear-all");
      setError("");

      await api.post("audit-logs/activities/clear-all/");
      await reloadRecentActivity();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to clear audit activity.");
    } finally {
      setActivityActionLoading("");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    const confirmed = window.confirm("Delete this activity row?");
    if (!confirmed) return;

    try {
      setActivityActionLoading(String(activityId));
      setError("");

      await api.delete(`audit-logs/activities/${activityId}/`);
      await reloadRecentActivity();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to delete audit activity.");
    } finally {
      setActivityActionLoading("");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Live overview of platform counts and recent user actions.
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Centers</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{summary.counts.centers}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Analysts</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{summary.counts.analysts}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Counsellors</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{summary.counts.counsellors}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{summary.counts.students}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-sm text-gray-500">Who performed what action and when.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleClearAllActivities}
                disabled={loading || activityActionLoading !== ""}
                className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activityActionLoading === "clear-all" ? "Clearing All..." : "Clear All"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-700">Time</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Performed By</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Performed For</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Action</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-700 text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                      Loading dashboard data...
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                      No audit activity found.
                    </td>
                  </tr>
                ) : (
                  activities.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      {(() => {
                        const target = getPerformedForParts(entry);
                        return (
                          <>
                      <td className="px-6 py-4">{formatDateTime(entry.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">
                          {entry.actor_name || entry.actor_email || "System"}
                        </div>
                        <div className="text-xs text-gray-500">{entry.actor_role || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">
                          {target.primary}
                        </div>
                        <div className="text-xs text-gray-500">
                          {target.secondary}
                        </div>
                      </td>
                      <td className="px-6 py-4">{entry.action}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(entry.id)}
                          disabled={activityActionLoading !== ""}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-300 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Delete activity row"
                        >
                          {activityActionLoading === String(entry.id) ? "..." : "X"}
                        </button>
                      </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Student Attendance</h2>
              <p className="text-sm text-gray-500">Student attendance percentage by selected batch.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
              >
                {centers.length === 0 ? (
                  <option value="">No centers</option>
                ) : (
                  centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))
                )}
              </select>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
              >
                {batches.length === 0 ? (
                  <option value="">No batches in selected center</option>
                ) : (
                  batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-700">Student</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Present Days</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Total Working Days</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Completed Working Days</th>
                  <th className="px-6 py-3 font-medium text-gray-700">Attendance % (Till Today)</th>
                </tr>
              </thead>
              <tbody>
                {reportLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                      Loading batch attendance...
                    </td>
                  </tr>
                ) : !batchReport || !batchReport.students || batchReport.students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                      No student attendance data for this batch.
                    </td>
                  </tr>
                ) : (
                  batchReport.students.map((row) => (
                    <tr key={row.student_id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-6 py-4">{row.name}</td>
                      <td className="px-6 py-4">{row.email}</td>
                      <td className="px-6 py-4">{row.present_days}</td>
                      <td className="px-6 py-4">{batchReport.total_working_days}</td>
                      <td className="px-6 py-4">{batchReport.completed_working_days}</td>
                      <td className="px-6 py-4 font-semibold">{row.attendance_percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminHome;
