"use client";
import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative w-full min-h-screen">
      {/* Fullscreen background image with overlay */}
      <div 
        className="fixed inset-0 z-0 w-screen h-screen"
        style={{
          backgroundImage: "url('/han jue.jpg')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
      </div>

      {/* Content - positioned on top of fixed background */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        <div className="home-hero text-center px-4">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(126,86,235,0.4) 100%)",
                  color: "#e9d5ff",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-[blink-dot_1.5s_ease-in-out_infinite]"></span>
              <span className="text-sm font-semibold tracking-wide">Read 💜 Enjoy</span>
            </div>
          </div>

          {/* Main Quote Heading */}
          <h1 style={{
            fontFamily: "GangBangers, var(--font-playfair), serif",
            fontSize: "clamp(2rem, 7vw, 4rem)",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            lineHeight: "1.2",
            color: "#ffffff",
            letterSpacing: "0.05em",
            textShadow: `
              0 0 10px rgba(167, 139, 250, 0.4),
              0 0 20px rgba(147, 112, 219, 0.3),
              0 0 30px rgba(126, 86, 235, 0.2)
            `,
            filter: "drop-shadow(0 0 15px rgba(167, 139, 250, 0.3))",
          }}>
            Endure Today<br />Freedom Tomorrow
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 font-medium italic tracking-wide">
            Follow the journey of Han Jue as he rises against fate
          </p>

          {/* CTA Buttons */}
          <div className="home-actions flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ttp-providence" className="home-btn primary px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:scale-105">
              Start Reading →
            </Link>
            <Link href="/ttp-providence" className="home-btn secondary px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:scale-105">
              Share Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
