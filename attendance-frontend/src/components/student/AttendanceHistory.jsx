const formatDuration = (duration) => {
  if (!duration) return "-";

  const [hours, minutes] = duration.split(":");
  return `${parseInt(hours, 10)}h ${parseInt(minutes, 10)}m`;
};

const formatLocalTime = (dateStr, timeStr, fallbackDisplay = null) => {
  if (fallbackDisplay) return fallbackDisplay;
  if (!timeStr) return "-";

  // Backend time is stored as HH:MM:SS. Treat as UTC and render in browser local time.
  const dt = new Date(`${dateStr}T${timeStr}Z`);
  if (Number.isNaN(dt.getTime())) return timeStr;

  return dt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusInfo = (record) => {
  if (record.pending_check_in) {
    return {
      label: "Checked In",
      className: "text-blue-600",
    };
  }

  if (record.check_in && !record.check_out) {
    return {
      label: "Checked In",
      className: "text-blue-600",
    };
  }

  if (record.check_in && record.check_out) {
    return record.is_present
      ? { label: "Present", className: "text-green-600" }
      : { label: "Absent", className: "text-red-500" };
  }

  return {
    label: "Absent",
    className: "text-red-500",
  };
};

const AttendanceHistory = ({ attendance = [] }) => {
  const sortedAttendance = [...attendance].sort((a, b) => {
    if (a.pending_check_in && !b.pending_check_in) return -1;
    if (!a.pending_check_in && b.pending_check_in) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-300">
        <h3 className="text-lg font-semibold">Attendance History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="px-6 py-3 text-left font-medium text-gray-700">Date</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Check-in</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Check-out</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Time Spent</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
            </tr>
          </thead>

          <tbody>
            {sortedAttendance.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                  No attendance records
                </td>
              </tr>
            ) : (
              sortedAttendance.map((a) => {
                const statusInfo = getStatusInfo(a);

                return (
                  <tr key={a.id ?? a.date} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-6 py-4">{a.date}</td>
                    <td className="px-6 py-4">
                      {formatLocalTime(a.date, a.check_in, a.check_in_display)}
                    </td>
                    <td className="px-6 py-4">{formatLocalTime(a.date, a.check_out)}</td>
                    <td className="px-6 py-4 font-medium">{formatDuration(a.total_duration)}</td>
                    <td className={`px-6 py-4 font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistory;
