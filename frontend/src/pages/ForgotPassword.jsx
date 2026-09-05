import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEnvelope, FaArrowRight } from "react-icons/fa";
import api from "../api/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password", null, {
        params: {
          email: email,
        },
      });

      console.log("Forgot password response:", response.data);

      setToken(response.data.reset_token);

      toast.success("Password reset token generated!");

    } catch (error) {
      console.error("Forgot password error:", error);

      const message =
        error.response?.data?.detail ||
        "Unable to process password reset request.";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white relative overflow-hidden">

      {/* Background */}

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-180px] left-[-130px] w-[400px] h-[400px] bg-blue-600/20 blur-[110px] rounded-full" />

        <div className="absolute bottom-[-200px] right-[10%] w-[450px] h-[400px] bg-indigo-600/20 blur-[130px] rounded-full" />

      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          {/* Logo */}

          <div className="text-center mb-6">

            <h1 className="font-bold tracking-[0.18em] text-lg">
              TRISHUL CRM
            </h1>

            <p className="text-[10px] text-slate-400 mt-1">
              Enterprise Cloud Portal
            </p>

          </div>

          {/* Card */}

          <div className="bg-white/[0.035] backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-center">
              Forgot Password?
            </h2>

            <p className="text-xs text-slate-400 text-center mt-2 mb-6">
              Enter your registered email address to reset your password.
            </p>

            <form onSubmit={handleSubmit}>

              {/* Email */}

              <label className="block text-xs text-slate-300 mb-1.5">
                Email Address
              </label>

              <div className="relative mb-4">

                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                />

              </div>

              {/* Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >

                {loading
                  ? "Processing..."
                  : "Send Reset Request"}

                {!loading && (
                  <FaArrowRight className="text-xs" />
                )}

              </button>

            </form>

            {/* Temporary token */}

            {token && (
              <div className="mt-5">

                <p className="text-xs text-yellow-400 mb-2">
                  Development reset token:
                </p>

                <div className="bg-black/30 border border-white/10 rounded-lg p-3 break-all text-xs text-slate-300">
                  {token}
                </div>

                <p className="text-[10px] text-slate-500 mt-2">
                  This token is displayed temporarily for testing.
                </p>

              </div>
            )}

            {/* Back */}

            <p className="text-center text-xs text-slate-500 mt-6">

              Remember your password?{" "}

              <Link
                to="/"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Sign In
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}