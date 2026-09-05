"use client";

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaLock,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import api from "../api/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset link.");
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", {
        token: token,
        new_password: formData.password,
      });

      console.log("Password reset response:", response.data);

      setSuccess(true);

      toast.success("Password reset successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);

      const message =
        error.response?.data?.detail ||
        "Unable to reset password.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-[-180px] left-[-150px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="absolute bottom-[-180px] right-[-150px] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-7">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-400/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold text-lg">
                T
              </span>
            </div>

            <span className="font-bold tracking-[0.18em] text-lg">
              TRISHUL CRM
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Enterprise Cloud Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0b1324]/95 border border-slate-700/50 rounded-2xl shadow-2xl p-7">

          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                  <FaLock className="text-blue-400 text-lg" />
                </div>

                <h1 className="text-2xl font-semibold">
                  Reset Password
                </h1>

                <p className="text-sm text-slate-400 mt-1">
                  Create a new secure password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    New Password
                  </label>

                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full bg-[#070e1d] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />

                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className="w-full bg-[#070e1d] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                  <FaShieldAlt className="text-blue-400 mt-0.5 shrink-0" />

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use a strong password containing a combination of
                    letters, numbers, and special characters.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-lg text-sm font-semibold transition"
                >
                  {loading ? (
                    "Resetting Password..."
                  ) : (
                    <>
                      Reset Password
                      <FaArrowRight className="text-xs" />
                    </>
                  )}
                </button>

              </form>

              {/* Back */}
              <button
                onClick={() => navigate("/login")}
                className="w-full mt-5 text-xs text-slate-400 hover:text-blue-400 transition"
              >
                ← Back to Sign In
              </button>
            </>
          ) : (
            /* Success */
            <div className="text-center py-8">

              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
                <FaCheckCircle className="text-green-400 text-3xl" />
              </div>

              <h1 className="text-2xl font-semibold mb-2">
                Password Reset Successful
              </h1>

              <p className="text-sm text-slate-400">
                Your password has been updated successfully.
              </p>

              <p className="text-xs text-slate-500 mt-4">
                Redirecting you to the login page...
              </p>

            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-5">
          © 2026 Trishul CRM • Secure Enterprise Platform
        </p>

      </div>
    </div>
  );
}