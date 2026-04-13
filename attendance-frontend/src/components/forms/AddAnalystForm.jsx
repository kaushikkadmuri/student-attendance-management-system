


import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";

const AddAnalystForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.state?.analyst ? true : false;


  const [centers, setCenters] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    mobile: "",
    email: "",
    password: "",
    gender: "",
    center: ""
  });

  // 🔹 Fetch centers from backend
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await api.get("centers/");
        setCenters(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCenters();
  }, []);

  useEffect(() => {
  if (isEdit) {
    const analyst = location.state.analyst;

    setFormData({
      id: analyst.id,
      name: analyst.name || "",
      mobile: analyst.mobile || "",
      email: analyst.email || "",
      password: "",
      gender: analyst.gender || "",
      center: analyst.centerId || analyst.center || ""
    });
  }
}, [isEdit, location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    if (isEdit) {
      // 🔹 UPDATE MODE
      await api.put(`auth/update-analyst/${formData.id}/`, {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        center: formData.center,
        mobile: formData.mobile,
        gender: formData.gender
      });

    } else {
      // 🔹 CREATE MODE
      await api.post("auth/create-analyst/", {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        center: formData.center,
        mobile: formData.mobile,
        gender: formData.gender
      });
    }

    navigate("/analysts");

  } catch (error) {
    console.log(error.response?.data);
    alert("Error saving analyst");
  }
};


  return (
    <DashboardLayout>

      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-xl font-semibold text-gray-800 mb-6">
          {isEdit ? "Edit Analyst" : "Add Analyst"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="mobile"
            placeholder="Mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            name="center"
            value={formData.center}
            onChange={handleChange}
            className="w-full p-2.5 border rounded-lg"
            required
          >
            <option value="" disabled>Select Center</option>
            {centers.map(center => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>

          <button className="w-full bg-green-600 text-white py-2.5 rounded-lg">
            {isEdit ? "Update Analyst" : "Add Analyst"}
          </button>

        </form>
      </div>

    </DashboardLayout>
  );
};

export default AddAnalystForm;
