import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const stepTitle = {
    1: "Recover your account",
    2: "Confirm security code",
    3: "Choose a new password",
  };

  const stepHint = {
    1: "Enter your registered email to receive an OTP.",
    2: "Check your inbox and enter the one-time code.",
    3: "Use a strong password you have not used before.",
  };

  const handleSendOtp = async () => {
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("auth/forgot-password/", { email });
      setMessage("OTP sent to your email.");
      setStep(2);
    } catch {
      setError("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("auth/verify-otp/", { email, otp });
      setMessage("OTP verified.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("auth/reset-password/", {
        email,
        otp,
        new_password: newPassword,
      });

      setMessage("Password reset successful.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.error || "Reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-100 relative overflow-hidden px-4 py-4 sm:py-6 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.14),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.12),transparent_40%)]" />

      <div className="relative z-10 w-full max-w-4xl h-full max-h-180 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-linear-to-br from-sky-100 via-blue-50 to-amber-50 border-r border-slate-200">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-cyan-700">Student Attendance Portal</p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-slate-900">
              Secure password recovery in three quick steps.
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-700">Account recovery</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">{stepTitle[step]}</h2>
            <p className="mt-2 text-sm text-slate-600">{stepHint[step]}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Step {step} of 3</span>
                <span>{Math.round((step / 3) * 100)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {step === 1 && (
                <>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">Registered Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || !email}
                    className="w-full py-3 rounded-lg font-medium text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">One-Time Password (OTP)</label>
                  <div className="relative">
                    <input
                      type={showOtp ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 pr-16 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtp((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      {showOtp ? "Hide" : "Show"}
                    </button>
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || !otp}
                    className="w-full py-3 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    Change Email
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter a strong password"
                      className="w-full px-4 py-3 pr-16 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="w-full px-4 py-3 pr-16 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    Use at least 8 characters with uppercase, lowercase, number, and symbol.
                  </p>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full py-3 rounded-lg font-medium text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 space-y-3 pb-1">
              {error && (
                <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 wrap-break-word">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 wrap-break-word">
                  {message}
                </p>
              )}

              <button
                onClick={() => navigate("/")}
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
