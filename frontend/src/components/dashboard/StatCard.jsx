import { motion } from "framer-motion";
import CountUp from "react-countup";

export default function StatCard({ title, value, color }) {
  const isNumber =
    typeof value === "number" ||
    (!isNaN(value) && value !== "");

  return (
    <motion.div
      whileHover={{
        scale: 1.05,
        y: -6,
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`${color} rounded-xl p-6 shadow-xl cursor-pointer relative overflow-hidden`}
    >
      {/* Background Glow */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

      <h3 className="text-white text-lg font-medium relative z-10">
        {title}
      </h3>

      <p className="text-4xl font-bold text-white mt-4 relative z-10">
       {value}
      </p>
    </motion.div>
  );
}