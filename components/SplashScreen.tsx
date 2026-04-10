import React, { useEffect, useState } from "react";
import { Gem, Rocket, Zap } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Memuat...");

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase(1), 150);
    const timer2 = setTimeout(() => setAnimationPhase(2), 500);

    // Loading progress animation - synchronized with total duration
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2; // Slower increment for smoother progress
      });
    }, 30); // Total time: 100 / 2 * 30ms = 1500ms

    // Loading text changes
    const textTimer1 = setTimeout(
      () => setLoadingText("Menyiapkan Platform..."),
      500
    );
    const textTimer2 = setTimeout(
      () => setLoadingText("Memuat Data Robux..."),
      1000
    );
    const textTimer3 = setTimeout(() => setLoadingText("Hampir Siap..."), 1400);

    const timer3 = setTimeout(() => setAnimationPhase(3), 1400);

    // Close splashscreen only after progress reaches 100%
    const timer4 = setTimeout(() => {
      setAnimationPhase(4);
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 300);
    }, 1700); // Wait for progress to complete (1500ms) + small buffer

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(textTimer1);
      clearTimeout(textTimer2);
      clearTimeout(textTimer3);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-gradient-to-br from-[#0f0215] via-[#1a0b2e] to-[#2d1b69] overflow-hidden transition-all duration-500 ${
        animationPhase >= 4 ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent animate-pulse delay-500"></div>

        {/* Multiple glowing orbs with different sizes */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-neon-pink/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-neon-purple/20 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-3/4 left-1/2 w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 bg-primary-100/30 rounded-full blur-xl sm:blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-blue-500/20 rounded-full blur-lg sm:blur-xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-violet-500/25 rounded-full blur-xl sm:blur-2xl animate-pulse delay-1200"></div>

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/40 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative text-center px-4 sm:px-6 md:px-8 w-full max-w-6xl">
        {/* Enhanced Main Title */}
        <div className="mb-6 sm:mb-8 relative">
          {/* Glowing backdrop */}
          <div className="absolute inset-0 blur-xl sm:blur-2xl opacity-30 sm:opacity-50">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-wider bg-gradient-to-r from-neon-pink via-purple-500 to-neon-purple bg-clip-text text-transparent">
              RBXNET
            </h1>
          </div>

          <h1
            className={`relative text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-wider transition-all duration-1000 ease-out ${
              animationPhase >= 1
                ? "opacity-100 transform translate-y-0 scale-100"
                : "opacity-0 transform translate-y-6 sm:translate-y-12 scale-90"
            }`}
            style={{
              background:
                "linear-gradient(135deg, #f63ae6 0%, #b354c3 35%, #8B5CF6 70%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              animation:
                animationPhase >= 2
                  ? "gradientShift 3s ease-in-out infinite"
                  : "none",
              filter:
                "drop-shadow(0 0 15px rgba(246, 58, 230, 0.6)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.4))",
            }}
          >
            RBXNET
          </h1>
        </div>

        {/* Subtitle */}
        <div className="mb-8 sm:mb-12">
          <p
            className={`text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-light text-white/90 tracking-wide transition-all duration-1000 delay-500 ease-out px-2 ${
              animationPhase >= 1
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-4"
            }`}
          >
            Platform RBX Terpercaya Indonesia
          </p>
        </div>

        {/* Enhanced Loading Animation */}
        <div
          className={`transition-all duration-700 ${
            animationPhase >= 2
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform translate-y-4"
          }`}
        >
          {/* Loading Text with glow */}

          {/* Modern Loading Spinner */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="relative">
              {/* Outer ring */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-white/20 rounded-full"></div>
              {/* Animated ring */}
              <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-transparent border-t-neon-pink border-r-neon-purple rounded-full animate-spin"></div>
              {/* Inner pulsing dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-4 sm:mb-6 px-4">
            <div className="relative w-full h-2 sm:h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
              <div
                className="h-full rounded-full relative overflow-hidden bg-primary-100 transition-all duration-300 ease-out"
                style={{
                  width: `${loadingProgress}%`,
                }}
              >
                {/* Shimmer animation */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: "shimmer 1.5s infinite",
                  }}
                ></div>
              </div>
            </div>
            {/* Percentage Text */}
            <div className="text-center mt-2">
              <span className="text-white/70 text-xs sm:text-sm font-medium">
                {Math.round(loadingProgress)}%
              </span>
            </div>
          </div>

          {/* Enhanced Status Icons */}
          <div className="flex justify-center space-x-4 sm:space-x-6 md:space-x-8 mt-4 sm:mt-6 px-4">
            {[
              {
                Icon: Gem,
                label: "Secure",
                threshold: 20,
                color: "text-emerald-400",
              },
              {
                Icon: Rocket,
                label: "Fast",
                threshold: 50,
                color: "text-blue-400",
              },
              {
                Icon: Zap,
                label: "Ready",
                threshold: 80,
                color: "text-yellow-400",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center space-y-1 sm:space-y-2"
              >
                <div
                  className={`p-2 sm:p-3 rounded-full border-2 ${
                    loadingProgress > item.threshold
                      ? `opacity-100 ${item.color} border-current bg-current/10 shadow-lg`
                      : "opacity-30 text-white/30 border-white/20 bg-white/5"
                  }`}
                >
                  <item.Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    loadingProgress > item.threshold
                      ? "text-white/80"
                      : "text-white/30"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Year */}
        <div
          className={`mt-6 sm:mt-8 transition-opacity duration-500 delay-[0.8s] ${
            animationPhase >= 2 ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-white/60 text-xs sm:text-sm font-medium tracking-widest">
            EST - 2024
          </p>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-neon-pink/30"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-neon-purple/30"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-neon-purple/30"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-neon-pink/30"></div>

      {/* Enhanced CSS Animation Styles */}
      <style jsx>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes moveGradient {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        @keyframes moveShimmer {
          0% {
            background-position: -200% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
