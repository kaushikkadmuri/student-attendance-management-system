
// const TodayAttendance = ({
//   checkedInToday,
//   onCheckIn,
//   batchStartDate,
//   batchEndDate,
// }) => {

//   const today = new Date();
//   const todayStr = today.toISOString().split("T")[0];
//   const dayOfWeek = today.getDay(); // 0 = Sunday

//   let disabled = false;
//   let message = "";

//   // Batch not started
//   if (batchStartDate && todayStr < batchStartDate) {
//     disabled = true;
//     message = "Batch has not started yet";
//   }

//   // Batch ended
//   if (batchEndDate && todayStr > batchEndDate) {
//     disabled = true;
//     message = "Batch completed";
//   }

//   // Sunday
//   if (dayOfWeek === 0) {
//     disabled = true;
//     message = "Sunday (No Attendance)";
//   }

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h3 className="text-lg font-semibold mb-2">
//         Today&apos;s Attendance
//       </h3>

//       <p className="mb-2">
//         Status:{" "}
//         {checkedInToday ? (
//           <span className="text-green-600">
//             Checked In
//           </span>
//         ) : (
//           <span className="text-red-500">
//             Not Checked In
//           </span>
//         )}
//       </p>

//       {message && (
//         <p className="text-sm text-gray-500 mb-3">
//           {message}
//         </p>
//       )}

//       <button
//         onClick={onCheckIn}
//         disabled={checkedInToday || disabled}
//         className={`w-full py-2 rounded text-white ${
//           checkedInToday || disabled
//             ? "bg-gray-400 cursor-not-allowed"
//             : "bg-blue-600 hover:bg-blue-700"
//         }`}
//       >
//         {checkedInToday
//           ? "Checked In"
//           : disabled
//           ? "Unavailable"
//           : "Check In"}
//       </button>
//     </div>
//   );
// };

// export default TodayAttendance;


const TodayAttendance = ({
  checkedInToday,
  checkedOutToday,
  onCheckIn,
  onCheckOut,
  onResetToday,
  resettingToday = false,
  batchStartDate,
  batchEndDate,
}) => {

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();

  let disabled = false;
  let message = "";

  if (batchStartDate && todayStr < batchStartDate) {
    disabled = true;
    message = "Batch has not started yet";
  }

  if (batchEndDate && todayStr > batchEndDate) {
    disabled = true;
    message = "Batch completed";
  }

  if (dayOfWeek === 0) {
    disabled = true;
    message = "Sunday (No Attendance)";
  }

  return (
    <div className="flex-1 bg-white p-6 rounded shadow flex flex-col">
      <h3 className="text-lg font-semibold mb-4">
        Today&apos;s Attendance
      </h3>

      {/* Not Checked In */}
      {!checkedInToday && !disabled && (
        <button
          onClick={onCheckIn}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Check In
        </button>
      )}

      {/* Checked In but Not Checked Out */}
      {checkedInToday && !checkedOutToday && (
        <button
          onClick={onCheckOut}
          className="w-full py-2 bg-orange-500 text-white rounded"
        >
          Check Out
        </button>
      )}

      {/* Completed */}
      {checkedInToday && checkedOutToday && (
        <button
          disabled
          className="w-full py-2 bg-gray-400 text-white rounded"
        >
          Completed
        </button>
      )}

      {disabled && (
        <p className="text-sm text-gray-500 mt-3">
          {message}
        </p>
      )}

      {onResetToday && (
        <button
          onClick={onResetToday}
          disabled={resettingToday}
          className="w-full py-2 mt-3 bg-gray-800 text-white rounded disabled:opacity-60"
        >
          {resettingToday ? "Resetting..." : "Reset Today (Dev)"}
        </button>
      )}
    </div>
  );
};

export default TodayAttendance;
