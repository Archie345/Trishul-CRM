import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaShieldAlt,
  FaRobot,
  FaDatabase,
  FaArrowRight,
  FaGoogle,
} from "react-icons/fa";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import api from "../api/api";
import { auth } from "../firebase";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // NORMAL REGISTRATION
  // =========================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!formData.password) {
      toast.error("Please enter a password");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must contain at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
      });

      toast.success("Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);

      const message =
        error.response?.data?.detail ||
        "Registration failed. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GOOGLE REGISTRATION
  // =========================

 // =========================
// GOOGLE REGISTRATION
// =========================

const handleGoogleRegister = async () => {
  try {
    setLoading(true);

    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(
      auth,
      provider
    );

    console.log("Google user:", result.user);

    // Get Firebase ID token
    const idToken = await result.user.getIdToken();

    console.log("Firebase ID token received");

    // Send Firebase token to FastAPI
    const response = await api.post(
      "/auth/google",
      {
        id_token: idToken,
      }
    );

    console.log("FastAPI response:", response.data);

    // Save CRM JWT
    localStorage.setItem(
      "token",
      response.data.access_token
    );

    toast.success(
      "Google authentication successful!"
    );

    setTimeout(() => {
      navigate("/dashboard");
    }, 800);

  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    const message =
      error.response?.data?.detail ||
      error.message ||
      "Google authentication failed. Please try again.";

    toast.error(message);

  } finally {
    setLoading(false);
  }
};


  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#070b14] text-white relative overflow-hidden">

      {/* ================= BACKGROUND GLOW ================= */}

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-180px] left-[-130px] w-[400px] h-[400px] bg-blue-600/20 blur-[110px] rounded-full" />

        <div className="absolute bottom-[-200px] left-[15%] w-[500px] h-[400px] bg-indigo-600/20 blur-[130px] rounded-full" />

        <div className="absolute top-[20%] right-[-180px] w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full" />

      </div>

      {/* ================= MAIN ================= */}

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ================= HEADER ================= */}

        <header className="w-full px-6 lg:px-12 py-4">

          <div className="max-w-2xl mx-auto flex items-center justify-between">

            {/* Logo */}

            <div className="flex items-center gap-2.5">

              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">

                <span className="text-blue-400 font-bold">
                  ✦
                </span>

              </div>

              <div>

                <h1 className="font-bold tracking-[0.18em] text-sm">
                  TRISHUL CRM
                </h1>

                <p className="text-[10px] text-slate-400">
                  Enterprise Cloud Portal
                </p>

              </div>

            </div>

            {/* Navigation */}

            <div className="flex items-center gap-5 text-xs">

              <Link
                to="/login"
                className="text-slate-400 hover:text-white transition"
              >
                Sign In
              </Link>

              <span className="text-white font-semibold border-b-2 border-blue-400 pb-1.5">
                Register
              </span>

            </div>

            {/* Secure Auth */}

            <div className="hidden md:flex items-center gap-2 text-emerald-400 text-[10px]">

              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

              Secure Auth

            </div>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        <main className="flex-1 flex items-center justify-center px-4 py-3">

          <div className="w-full max-w-2xl">

            {/* ================= MAIN CARD ================= */}

            <div className="grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden border border-white/10 bg-white/[0.035] backdrop-blur-xl shadow-2xl">

              {/* ================= LEFT SIDE ================= */}

              <div className="p-4 flex flex-col justify-between">

                <div>

                  <p className="text-blue-400 text-xs font-semibold tracking-wide mb-2">
                    WELCOME TO TRISHUL
                  </p>

                  <h2 className="text-2xl lg:text-3xl font-bold leading-tight">
                    Get Started
                  </h2>

                  <p className="text-slate-400 mt-3 max-w-md leading-6 text-sm">
                    Create your account with role-based access
                    control to start managing your team's
                    workflows efficiently.
                  </p>

                  {/* ================= FEATURES ================= */}

                  <div className="mt-4 space-y-3">

                    {/* Feature 1 */}

                    <div className="flex gap-3">

                      <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">

                        <FaDatabase className="text-amber-400 text-sm" />

                      </div>

                      <div>

                        <h3 className="font-semibold text-sm text-white">
                          Live Cloud Persistence
                        </h3>

                        <p className="text-xs text-slate-400 mt-1 leading-5">
                          Your CRM data stays synchronized
                          with your secure backend database.
                        </p>

                      </div>

                    </div>

                    {/* Feature 2 */}

                    <div className="flex gap-3">

                      <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">

                        <FaShieldAlt className="text-cyan-400 text-sm" />

                      </div>

                      <div>

                        <h3 className="font-semibold text-sm text-white">
                          Role-Based Access
                        </h3>

                        <p className="text-xs text-slate-400 mt-1 leading-5">
                          Admin, Supervisor and Employee
                          access can be managed securely.
                        </p>

                      </div>

                    </div>

                    {/* Feature 3 */}

                    <div className="flex gap-3">

                      <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">

                        <FaRobot className="text-emerald-400 text-sm" />

                      </div>

                      <div>

                        <h3 className="font-semibold text-sm text-white">
                          AI Sales Assistant
                        </h3>

                        <p className="text-xs text-slate-400 mt-1 leading-5">
                          Smart summaries, lead insights and
                          business intelligence.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

                {/* Bottom Left */}

                <div className="border-t border-white/10 pt-3 mt-5 flex justify-between text-[10px] text-slate-500">

                  <span>
                    Enterprise Edition
                  </span>

                  <span className="flex items-center gap-1.5 text-emerald-400">

                    <FaCheckCircle />

                    Secure Auth

                  </span>

                </div>

              </div>

              {/* ================= RIGHT SIDE ================= */}

              <div className="p-4 bg-white/[0.025] border-l border-white/10">

                <div className="max-w-sm mx-auto">

                  <div className="mb-5">

                    <h2 className="text-xl font-bold">
                      Create your account
                    </h2>

                    <p className="text-slate-400 text-xs mt-1">
                      Register to access the Trishul CRM
                      platform.
                    </p>

                  </div>

                  {/* ================= FORM ================= */}

                  <form onSubmit={handleRegister}>

                    {/* Full Name */}

                    <div className="mb-3">

                      <label className="block text-xs text-slate-300 mb-1.5">

                        Full Name{" "}

                        <span className="text-blue-400">
                          *
                        </span>

                      </label>

                      <div className="relative">

                        <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="e.g. Archie"
                          className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                        />

                      </div>

                    </div>

                    {/* Email */}

                    <div className="mb-3">

                      <label className="block text-xs text-slate-300 mb-1.5">

                        Email Address{" "}

                        <span className="text-blue-400">
                          *
                        </span>

                      </label>

                      <div className="relative">

                        <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@gmail.com"
                          className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                        />

                      </div>

                    </div>

                    {/* Password */}

                    <div className="mb-3">

                      <label className="block text-xs text-slate-300 mb-1.5">

                        Password{" "}

                        <span className="text-slate-500">
                          (min. 6 characters)
                        </span>

                        <span className="text-blue-400">
                          {" "}*
                        </span>

                      </label>

                      <div className="relative">

                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password"
                          className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                        />

                      </div>

                    </div>

                    {/* Remember Session */}

                    <div className="flex items-center gap-2 mb-5">

                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) =>
                          setRemember(e.target.checked)
                        }
                        className="w-3.5 h-3.5 accent-blue-500"
                      />

                      <span className="text-xs text-slate-400">
                        Remember session
                      </span>

                    </div>

                    {/* Register Button */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
                    >

                      {loading
                        ? "Creating Account..."
                        : "Register Account"}

                      {!loading && (
                        <FaArrowRight className="text-xs" />
                      )}

                    </button>

                  </form>

                  {/* ================= DIVIDER ================= */}

                  <div className="flex items-center gap-3 my-5">

                    <div className="flex-1 h-px bg-white/10" />

                    <span className="text-[10px] text-slate-500">
                      OR
                    </span>

                    <div className="flex-1 h-px bg-white/10" />

                  </div>

                  {/* ================= GOOGLE ================= */}

                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >

                    <FaGoogle className="text-red-400 text-xs" />

                    {loading
                      ? "Connecting..."
                      : "Continue with Google"}

                  </button>

                  {/* ================= LOGIN ================= */}

                  <p className="text-center text-xs text-slate-500 mt-5">

                    Already have an account?{" "}

                    <Link
                      to="/login"
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Sign In
                    </Link>

                  </p>

                </div>

              </div>

            </div>

            {/* ================= FOOTER ================= */}

            <div className="flex justify-between items-center text-[10px] text-slate-600 mt-3 px-1">

              <span>
                Trishul CRM Cloud Platform
              </span>

              <span>
                Protected by Secure Authentication
              </span>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}