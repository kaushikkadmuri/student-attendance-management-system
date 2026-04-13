const AttendanceSummary = ({
  totalWorkingDays = 0,
  completedWorkingDays = 0,
  presentDays = 0,
}) => {

  const absentDays = Math.max(
    completedWorkingDays - presentDays,
    0
  );

  const percentage = completedWorkingDays
    ? Math.round((presentDays / completedWorkingDays) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <p className="text-gray-500">Total Working Days</p>
        <h3 className="text-xl font-semibold">
          {totalWorkingDays}
        </h3>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <p className="text-gray-500">Present</p>
        <h3 className="text-xl font-semibold text-green-600">
          {presentDays}
        </h3>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <p className="text-gray-500">Absent</p>
        <h3 className="text-xl font-semibold text-red-500">
          {absentDays}
        </h3>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <p className="text-gray-500">Attendance %</p>
        <h3 className="text-xl font-semibold">
          {percentage}%
        </h3>
      </div>
    </div>
  );
};

export default AttendanceSummary;