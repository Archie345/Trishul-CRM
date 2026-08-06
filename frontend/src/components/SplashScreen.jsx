import { motion } from "framer-motion";
import logo from "../assets/logo.jpeg";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center">

      {/* Animated Background Glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
          }}
          animate={{
            y: -100,
          }}
          transition={{
            duration: 8 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "linear",
          }}
        />
      ))}

      {/* Logo */}
      <motion.img
        src={logo}
        alt="Trishul CRM"
        className="w-44 h-44 rounded-full shadow-[0_0_60px_rgba(59,130,246,0.8)] z-10"
        initial={{
          scale: 0,
          rotate: -180,
          opacity: 0,
        }}
        animate={{
          scale: [1, 1.05, 1],
          y: [0, -10, 0],
          rotate: 0,
          opacity: 1,
        }}
        transition={{
          duration: 2.8,
          ease: "easeOut",
        }}
      />

      {/* Title */}
      <motion.h1
        className="text-5xl font-bold text-white mt-8 z-10 tracking-wider"
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 2.5,
          duration: 1.5,
        }}
      >
        TRISHUL CRM
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-blue-200 mt-4 text-lg z-10"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 4.2,
          duration: 1.2,
        }}
      >
        Smart Business Management
      </motion.p>

      {/* Loading Text */}
      <motion.div
        className="mt-10 text-gray-300 text-lg z-10"
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.8,
        }}
      >
        Initializing CRM...
      </motion.div>

    </div>
  );
}