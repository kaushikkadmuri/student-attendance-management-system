import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import AddAnalystForm from "./components/forms/AddAnalystForm.jsx";
// import AdminDashboard from "./layouts/AdminDashboard.jsx";
import AnalystsPage from "./pages/admin/AnalystsPage.jsx";
import CounsellorsPage from "./pages/admin/CounsellorPage.jsx";
import AddCounsellorForm from "./components/forms/AddCounsellorForm.jsx";
import CentersPage from "./pages/admin/CentersPage.jsx";
import AddCenterForm from "./components/forms/AddCenterForm.jsx";
import ManageAnalysts from "./components/admin/ManageAnalysts.jsx";
import ManageCounsellors from "./components/admin/ManageCounsellors.jsx";
import ManageCenters from "./components/admin/ManageCenters.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AnalystDashboard from "./pages/analyst/AnalystDashboard.jsx";
import ManageBatches from "./components/analyst/ManageBatches.jsx";
import AddBatchForm from "./components/forms/AddBatchForm.jsx";
import BatchesPage from "./pages/analyst/BatchesPage.jsx";
import StudentsPage from "./pages/counsellor/StudentsPage.jsx";
import CounsellorDashboard from "./pages/counsellor/CounsellorDashboard.jsx";
import StudentDashboard from "./pages/student/StudentDashboard";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <>


    <Routes>
  {/* Auth */}
  <Route path="/" element={<Login />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />

  {/* Admin */}
  <Route path="/admin/dashboard" element={<AdminHome />} />
  <Route path="/analysts" element={<AnalystsPage />} />
  <Route path="/add-analyst" element={<AddAnalystForm />} />
  <Route path="/counsellors" element={<CounsellorsPage />} />
  <Route path="/add-counsellor" element={<AddCounsellorForm />} />
  <Route path="/centers" element={<CentersPage />} />
  <Route path="/add-center" element={<AddCenterForm />} />
  <Route path="/manage-analysts" element={<ManageAnalysts />} />
  <Route path="/manage-counsellors" element={<ManageCounsellors />} />
  <Route path="/manage-centers" element={<ManageCenters />} />

  {/* Analyst */}
  <Route path="/analyst/dashboard" element={<AnalystDashboard />} />
  <Route path="/batches" element={<BatchesPage />} />
  <Route path="/add-batch" element={<AddBatchForm />} />
  <Route path="/manage-batches" element={<ManageBatches />} />

  {/* Counsellor */}
  <Route path="/counsellor/dashboard" element={<CounsellorDashboard />} />

  <Route path="/student/dashboard" element={<StudentDashboard />} />

  {/* ⭐ STUDENTS (FIXED) */}
  <Route path="/counsellor/students" element={<StudentsPage />} />
  <Route path="/counsellor/students/add" element={<Navigate to="/counsellor/students" replace />} />
  <Route path="/counsellor/students/edit/:id" element={<Navigate to="/counsellor/students" replace />} />
</Routes>

    </>
  );
}

export default App;
