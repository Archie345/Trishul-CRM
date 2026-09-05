import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function CRMFooter() {
  return (
    <footer className="w-full px-4 lg:px-8 pb-4 pt-2">

      <div
        className="
          w-full
          min-h-[72px]
          rounded-2xl
          border border-white/10
          bg-slate-900/95
          backdrop-blur-xl
          shadow-2xl
          px-5 lg:px-7
          py-3
          flex
          items-center
          justify-between
        "
      >

        {/* ================= LEFT ================= */}

        <Link
          to="/dashboard"
          className="flex items-center gap-3"
        >

          {/* Logo */}

          <div
            className="
              w-10 h-10
              rounded-xl
              border border-blue-400/20
              bg-blue-500/10
              flex items-center justify-center
              flex-shrink-0
            "
          >
            <span className="text-blue-400 text-lg font-bold">
              ✦
            </span>
          </div>

          {/* Brand */}

          <div>
            <h1 className="text-white font-bold text-base lg:text-lg tracking-wide">
              TRISHUL CRM
            </h1>

            <p className="text-blue-300/70 text-[10px] lg:text-xs tracking-wider">
              INNOVATE • EMPOWER • EXCEL
            </p>
          </div>

        </Link>


        {/* ================= RIGHT ================= */}

        <div className="flex items-center gap-2 text-emerald-400">

          <FaWhatsapp className="text-base lg:text-lg" />

          <span className="hidden sm:block text-xs lg:text-sm">
            WhatsApp: +91 945510867
          </span>

        </div>

      </div>

    </footer>
  );
}