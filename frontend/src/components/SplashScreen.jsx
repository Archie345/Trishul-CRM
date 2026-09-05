import "./SplashScreen.css";

export default function SplashScreen() {
  return (
    <div className="splash-screen">

      {/* Background glow */}
      <div className="energy-glow"></div>
      <div className="energy-glow glow-two"></div>

      {/* Lightning particles */}
      <div className="lightning lightning-1"></div>
      <div className="lightning lightning-2"></div>
      <div className="lightning lightning-3"></div>
      <div className="lightning lightning-4"></div>

      {/* Central energy beam */}
      <div className="energy-beam"></div>

      {/* Trishul */}
      <div className="trishul-wrapper">

        <svg
          className="trishul"
          viewBox="0 0 200 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left spear */}
          <path
            d="M70 105 L55 30 L72 72 L82 30 L91 105"
            className="trishul-line"
          />

          {/* Center spear */}
          <path
            d="M100 110 L100 15 L115 65 L100 50"
            className="trishul-line"
          />

          {/* Right spear */}
          <path
            d="M109 105 L118 30 L128 72 L145 30 L130 105"
            className="trishul-line"
          />

          {/* Central shaft */}
          <path
            d="M100 95 L100 260"
            className="trishul-line shaft"
          />

          {/* Cross section */}
          <path
            d="M68 105 Q100 125 132 105"
            className="trishul-line"
          />

          {/* Bottom handle */}
          <path
            d="M85 255 L115 255 L120 275 L80 275 Z"
            className="trishul-line"
          />
        </svg>

      </div>

      {/* Energy burst */}
      <div className="energy-burst"></div>

      {/* Brand */}
      <div className="brand">
        <div className="brand-title">TRISHUL</div>
        <div className="brand-subtitle">CRM</div>
      </div>

      {/* Loading line */}
      <div className="loading-line">
        <span></span>
      </div>

    </div>
  );
}