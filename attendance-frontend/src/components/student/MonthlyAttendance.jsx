const MonthlyAttendance = ({
  attendance,
  batchStartDate,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  canGoPrevMonth,
  canGoNextMonth,
  monthOptions = [],
  selectedMonthValue,
  onSelectMonth,
}) => {
  const getLocalDateString = (value = new Date()) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const monthDate = selectedMonth || new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const today = getLocalDateString();

  const monthName = monthDate.toLocaleString("default", {
    month: "long",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatDate = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const getStatusForDate = (dateStr) => {
    const record = attendance.find((a) => a.date === dateStr);

    if (record) {
      return record.is_present ? "Present" : "Absent";
    }

    if (!batchStartDate) return null;
    if (dateStr < batchStartDate) return null;
    if (dateStr > today) return null;

    const day = new Date(dateStr).getDay();
    if (day === 0) return null;

    return "Absent";
  };

  return (
    <div className="h-full bg-white rounded shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          Monthly Attendance - {monthName} {year}
        </h3>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonthValue}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="h-8 rounded border border-gray-300 px-2 text-sm text-gray-700 bg-white"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={!canGoPrevMonth}
            className="h-8 w-8 rounded border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous month"
          >
            {"<"}
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={!canGoNextMonth}
            className="h-8 w-8 rounded border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 border-b border-gray-200 px-4 py-2">
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 px-2 py-3 text-center">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = formatDate(year, month, day);
          const status = getStatusForDate(dateStr);

          let classes = "bg-gray-200 text-gray-700";

          if (status === "Present") classes = "bg-green-500 text-white";
          if (status === "Absent") classes = "bg-red-500 text-white";

          return (
            <div
              key={dateStr}
              title={dateStr}
              className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full text-xs font-medium ${classes}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex py-5 gap-6 px-8 pb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded-full" />
          Present
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded-full" />
          Absent
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-300 rounded-full" />
          No Record
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendance;
