
import { useState } from "react";
import loginImage from "../assets/images/loginbg.jpg";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";
import { setAccessToken } from "../utils/tokenService";

const Login = () => {
  const [showForgot, setShowForgot] = useState(false);
const [otpStep, setOtpStep] = useState(false);

const [resetEmail, setResetEmail] = useState("");
const [otp, setOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleSendOtp = async () => {
  try {
    await api.post("auth/forgot-password/", {
      email: resetEmail,
    });

    setMessage("OTP sent to your email.");
    setOtpStep(true);
  } catch (error) {
    setMessage("Something went wrong.");
  }
};

const handleResetPassword = async () => {
  try {
    await api.post("auth/reset-password/", {
      email: resetEmail,
      otp: otp,
      new_password: newPassword,
    });

    setMessage("Password reset successful. You can login now.");
    setShowForgot(false);
    setOtpStep(false);
  } catch (error) {
    setMessage(
      error.response?.data?.error || "Reset failed."
    );
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "auth/login/",   
        {
          email: email,
          password: password,
        }
      );

      const { access } = response.data;
      setAccessToken(access);

      // ✅ DO NOT store in localStorage
      // Access token should be stored in memory (we improve this later)

      // Decode token to get role
      const decoded = jwtDecode(access);

      const role = decoded.role;

      // Redirect based on role
      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "ANALYST") {
        navigate("/analyst/dashboard");
      } else if (role === "COUNSELLOR") {
        navigate("/counsellor/dashboard");
      } else if (role === "STUDENT") {
        navigate("/student/dashboard");
      } else {
        alert("Invalid role");
      }

    } catch (error) {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-screen">
        <img src={loginImage} className="h-screen" alt="Logo" />
      </div>

      <div className="w-full h-screen flex flex-col max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl mb-10">
          Welcome To{" "}
          <span className="text-5xl italic text-green-900">
            Kapil IT Skill Hub's
          </span>
        </h1>

        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
          Student Attendance System
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="relative">
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="peer w-full px-4 py-3 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <label
              htmlFor="email"
              className="absolute left-4 text-gray-500 transition-all bg-white px-1 top-3 text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-600"
            >
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="peer w-full px-4 py-3 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-4 text-gray-500 transition-all bg-white px-1 top-3 text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-600"
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-4xl font-medium transition"
          >
            Login
          </button>

          <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-blue-600 text-sm"
        >
          Forgot Password?
        </button>

        </form>
      </div>
    </div>
  );
};

export default Login;
