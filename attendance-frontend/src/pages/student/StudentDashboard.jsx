import { useEffect, useState } from "react";
import StudentLayout from "../../layouts/StudentLayout";
import api from "../../api/axios";

import AttendanceSummary from "../../components/student/AttendanceSummary";
import MonthlyAttendance from "../../components/student/MonthlyAttendance";
import TodayAttendance from "../../components/student/TodayAttendance";
import TimeStats from "../../components/student/TimeStats";
import AttendanceHistory from "../../components/student/AttendanceHistory";
import LocationVerificationModal from "../../components/student/LocationVerificationModal";
import LiveFaceVerificationModal from "../../components/student/LiveFaceVerificationModal";

const StudentDashboard = () => {
  const getLocalDateString = (value = new Date()) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (value = new Date()) => {
    return value.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseAttendanceFailure = (payload, action = "check-in") => {
    const raw = payload?.error || `${action === "check-out" ? "Check-out" : "Check-in"} failed`;
    const code = payload?.code;

    if (raw.includes("Outside allowed location")) {
      return {
        title: "Location Verification Failed",
        detail: "You are outside the allowed center radius.",
        help: "Move closer to your center location and retry.",
      };
    }

    if (raw.includes("Location is required")) {
      return {
        title: "Location Access Required",
        detail: "Location coordinates were not available.",
        help: "Allow location permission in your browser and retry.",
      };
    }

    if (raw.includes("No clear face detected")) {
      return {
        title: "Face Not Detected",
        detail: "No clear face was found in the selfie.",
        help: "Keep your full face centered, remove mask/shadow, and capture again.",
      };
    }

    if (raw.includes("Multiple faces detected")) {
      return {
        title: "Multiple Faces Found",
        detail: "More than one face appeared in the frame.",
        help: "Ensure only your face is visible in camera frame.",
      };
    }

    if (code === "FACE_NOT_MATCHED" || raw.includes("not matched")) {
      return {
        title: "Face Does Not Match Profile Photo",
        detail: "The captured face does not match your profile photo.",
        help: "Use the correct student face. If this is your face, update your profile photo.",
      };
    }

    if (code === "FACE_UNCLEAR" || raw.includes("Unable to verify your face")) {
      return {
        title: "Unable To Verify Face",
        detail: "Your face is not clearly visible in the selfie.",
        help: "Use good lighting, keep only one face in frame, and look directly at the camera.",
      };
    }

    return {
      title: `${action === "check-out" ? "Check-out" : "Check-in"} Failed`,
      detail: raw,
      help: "Retry verification. If this continues, contact admin.",
    };
  };

  const getMonthStart = (dateValue) => {
    const d = new Date(dateValue);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [studentLocation, setStudentLocation] = useState(null);
  const [attendanceIssue, setAttendanceIssue] = useState(null);
  const [resettingToday, setResettingToday] = useState(false);
  const [verificationMode, setVerificationMode] = useState("check-in");
  const [selectedMonth, setSelectedMonth] = useState(
    getMonthStart(new Date())
  );

  const todayString = getLocalDateString();

  const refreshAttendance = async () => {
    try {
      const res = await api.get("attendance/my/");
      const attendanceRows = Array.isArray(res.data) ? res.data : [];
      setAttendance(attendanceRows);

      const todayRecord = attendanceRows.find((a) => a.date === todayString);
      if (todayRecord) {
        setCheckedInToday(!!todayRecord.check_in);
        setCheckedOutToday(!!todayRecord.check_out);
      } else {
        setCheckedInToday(false);
        setCheckedOutToday(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("auth/me/");
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshAttendance();
  }, [user, todayString]);

  const calculateTotalWorkingDays = (start, end) => {
    if (!start || !end) return 0;

    let startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");

    let count = 0;

    while (startDate <= endDate) {
      if (startDate.getDay() !== 0) {
        count++;
      }
      startDate.setDate(startDate.getDate() + 1);
    }

    return count;
  };

  const calculateCompletedWorkingDays = (start) => {
    if (!start) return 0;

    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    let startDate = new Date(start + "T00:00:00");

    if (todayOnly < startDate) return 0;

    let count = 0;

    while (startDate <= todayOnly) {
      if (startDate.getDay() !== 0) {
        count++;
      }
      startDate.setDate(startDate.getDate() + 1);
    }

    return count;
  };

  const totalWorkingDays = user
    ? calculateTotalWorkingDays(
        user.batch_start_date,
        user.batch_end_date
      )
    : 0;

  const completedWorkingDays = user
    ? calculateCompletedWorkingDays(user.batch_start_date)
    : 0;

  const presentDays = attendance.filter((a) => a.is_present).length;
  const hasRealTodayRow = attendance.some((row) => row.date === todayString);
  const attendanceHistoryRows = checkedInToday && !checkedOutToday && !hasRealTodayRow
    ? [
        {
          id: `today-${todayString}`,
          date: todayString,
          check_in: null,
          check_in_display: getLocalTimeString(),
          check_out: null,
          total_duration: null,
          is_present: false,
          pending_check_in: true,
        },
        ...attendance.filter((row) => row.date !== todayString),
      ]
    : attendance;

  const currentMonthStart = getMonthStart(new Date());
  const minMonthStart = user?.batch_start_date
    ? getMonthStart(`${user.batch_start_date}T00:00:00`)
    : currentMonthStart;

  const canGoPrevMonth = selectedMonth > minMonthStart;
  const canGoNextMonth = selectedMonth < currentMonthStart;

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )
    );
  };

  const monthOptions = [];
  {
    let cursor = new Date(minMonthStart);
    while (cursor <= currentMonthStart) {
      monthOptions.push({
        value: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
        label: cursor.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      });
      cursor = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1
      );
    }
  }

  const selectedMonthValue = `${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  const handleMonthSelect = (value) => {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return;
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      if (
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        targetTag === "SELECT"
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && canGoPrevMonth) {
        setSelectedMonth(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        );
      }

      if (event.key === "ArrowRight" && canGoNextMonth) {
        setSelectedMonth(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoPrevMonth, canGoNextMonth]);

  const handleCheckInStart = () => {
    setAttendanceIssue(null);
    setStudentLocation(null);
    setVerificationMode("check-in");
    setShowLocationModal(true);
  };

  const handleCheckOutStart = () => {
    setAttendanceIssue(null);
    setStudentLocation(null);
    setVerificationMode("check-out");
    setShowLocationModal(true);
  };

  const handleLocationVerified = (location) => {
    setShowLocationModal(false);
    setStudentLocation(location);
    setShowFaceModal(true);
  };

  const handleFaceCapture = async (capturePayload) => {
    try {
      setAttendanceIssue(null);
      const payload =
        typeof capturePayload === "string"
          ? { selfie_image: capturePayload, liveness_images: {} }
          : capturePayload;

      await api.post(
        verificationMode === "check-out" ? "attendance/check-out/" : "attendance/check-in/",
        {
          latitude: studentLocation?.lat,
          longitude: studentLocation?.lng,
          selfie_image: payload.selfie_image,
          liveness_images: payload.liveness_images,
        }
      );

      if (verificationMode === "check-out") {
        setCheckedOutToday(true);
      } else {
        setCheckedInToday(true);
        setAttendance((prev) => {
          const existingRows = Array.isArray(prev) ? prev : [];
          const nextRows = existingRows.filter((row) => row.date !== todayString);
          return [
            {
              id: `today-${todayString}`,
              date: todayString,
              check_in: null,
              check_out: null,
              total_duration: null,
              is_present: false,
              pending_check_in: true,
            },
            ...nextRows,
          ];
        });
      }
      setShowFaceModal(false);
      await refreshAttendance();
      return true;
    } catch (err) {
      const issue = parseAttendanceFailure(err.response?.data || {}, verificationMode);
      setAttendanceIssue(issue);
      console.error(err);
      return false;
    }
  };

  const handleCheckOut = async () => {
    handleCheckOutStart();
  };

  const handleResetToday = async () => {
    try {
      setAttendanceIssue(null);
      setResettingToday(true);
      await api.post("attendance/reset-today/");
      setCheckedInToday(false);
      setCheckedOutToday(false);
      await refreshAttendance();
    } catch (err) {
      setAttendanceIssue({
        title: "Reset Failed",
        detail: err.response?.data?.error || "Unable to reset attendance",
        help: "Try again in a moment.",
      });
      console.error(err);
    } finally {
      setResettingToday(false);
    }
  };

  return (
    <StudentLayout>
      <AttendanceSummary
        totalWorkingDays={totalWorkingDays}
        completedWorkingDays={completedWorkingDays}
        presentDays={presentDays}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 my-6 items-stretch">
        <div className="min-w-0">
          <MonthlyAttendance
            attendance={attendance}
            batchStartDate={user?.batch_start_date}
            selectedMonth={selectedMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            canGoPrevMonth={canGoPrevMonth}
            canGoNextMonth={canGoNextMonth}
            monthOptions={monthOptions}
            selectedMonthValue={selectedMonthValue}
            onSelectMonth={handleMonthSelect}
          />
        </div>

        <div className="h-full flex flex-col gap-6">
          <TimeStats
            attendance={attendance}
            selectedMonth={selectedMonth}
          />

          <div className="flex-1 flex flex-col">
            <TodayAttendance
              checkedInToday={checkedInToday}
              checkedOutToday={checkedOutToday}
              onCheckIn={handleCheckInStart}
              onCheckOut={handleCheckOut}
              onResetToday={handleResetToday}
              resettingToday={resettingToday}
              batchStartDate={user?.batch_start_date}
              batchEndDate={user?.batch_end_date}
            />
            {attendanceIssue && (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-700">{attendanceIssue.title}</p>
                <p className="text-sm text-red-700 mt-1">{attendanceIssue.detail}</p>
                <p className="text-xs text-red-600 mt-2">{attendanceIssue.help}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AttendanceHistory attendance={attendanceHistoryRows} />
      </div>

      {showLocationModal && user && (
        <LocationVerificationModal
          center={{
            latitude: user.center_latitude,
            longitude: user.center_longitude,
            allowedRadius: user.allowed_radius,
          }}
          onSuccess={handleLocationVerified}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {showFaceModal && (
        <LiveFaceVerificationModal
          mode={verificationMode}
          onVerified={handleFaceCapture}
          onClose={() => setShowFaceModal(false)}
          errorTitle={attendanceIssue?.title}
          errorMessage={attendanceIssue?.detail}
        />
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;
