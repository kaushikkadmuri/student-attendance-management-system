// const TimeStats = ({
//   avg = "0h",
//   longest = "0h",
//   shortest = "0h",
// }) => {
//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h3 className="text-lg font-semibold mb-4">
//         Time Spent This Month
//       </h3>

//       <div className="space-y-2 text-sm">
//         <p>
//           <b>Average Time:</b> {avg}
//         </p>
//         <p>
//           <b>Longest Day:</b> {longest}
//         </p>
//         <p>
//           <b>Shortest Day:</b> {shortest}
//         </p>
//       </div>

//       {/* Placeholder bars */}
//       <div className="flex gap-2 items-end mt-6 h-24">
//         {[4, 6, 5, 7, 8, 6, 5].map((h, i) => (
//           <div
//             key={i}
//             className="bg-blue-500 w-full rounded"
//             style={{ height: `${h * 10}px` }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TimeStats;


const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;

  // "04:30:00"
  const [h, m] = duration.split(":").map(Number);
  return h * 60 + m;
};

const formatMinutes = (minutes) => {
  if (!minutes) return "0h 0m";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const TimeStats = ({ attendance = [], selectedMonth }) => {
  const monthDate = selectedMonth || new Date();
  const currentMonth = monthDate.getMonth();
  const currentYear = monthDate.getFullYear();
  const monthLabel = monthDate.toLocaleString("default", {
    month: "long",
  });

  // Filter only this month's attendance
  const monthlyRecords = attendance.filter((a) => {
    if (!a.total_duration) return false;

    const dateObj = new Date(a.date);
    return (
      dateObj.getMonth() === currentMonth &&
      dateObj.getFullYear() === currentYear
    );
  });

  const durations = monthlyRecords.map((a) =>
    parseDurationToMinutes(a.total_duration)
  );

  const totalMinutes = durations.reduce(
    (sum, m) => sum + m,
    0
  );

  const avgMinutes = durations.length
    ? Math.floor(totalMinutes / durations.length)
    : 0;

  const longestMinutes = durations.length
    ? Math.max(...durations)
    : 0;

  const shortestMinutes = durations.length
    ? Math.min(...durations)
    : 0;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">
        Time Spent - {monthLabel} {currentYear}
      </h3>

      <div className="space-y-2 text-sm">
        <p>
          <b>Average Time:</b> {formatMinutes(avgMinutes)}
        </p>
        <p>
          <b>Longest Day:</b> {formatMinutes(longestMinutes)}
        </p>
        <p>
          <b>Shortest Day:</b> {formatMinutes(shortestMinutes)}
        </p>
      </div>
    </div>
  );
};

export default TimeStats;
