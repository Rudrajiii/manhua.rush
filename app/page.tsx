"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Sparkles, TrendingUp, Zap, Star, BookOpen } from "lucide-react";
import type { StaticImageData } from "next/image";
import maki from "../public/maki.png";
import zf from "../public/zf.png"
import yuji from "../public/yuji.png"
import reze from "../public/reze.png"
import ichigo from "../public/ichigo.png"


export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <BackgroundRippleEffect />
      
      <div className="home-page">
        <div className="home-hero">
          {/* Read & Share Badge */}
          <div className="flex justify-center mb-6 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full " 
                 style={{
                   background: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(126,86,235,0.25) 100%)",
                   color: "#e9d5ff"
                 }}>
              <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-[blink-dot_1.5s_ease-in-out_infinite]"></span>
              <span className="text-sm font-semibold tracking-wide">Read 💜 Share</span>
            </div>
          </div>

          <h1 className="home-title">Craft Faster & Read</h1>
          <h2 className="sub-home-title">Translate Panels With Ease</h2>
          <p className="home-description">
            A community where fans collaborate togatger to translate manga, manhwa, and manhua into multiple languages for everyone to enjoy.
          </p>

          {/* Animated Stats */}
          <div className="flex justify-center gap-8 mb-4">
            <StatCounter value={315} suffix="+" label="Panels Translated" />
            <StatCounter value={5} suffix="" label="Series" />
            <StatCounter value={20} suffix="+" label="New Chapters" />
          </div>

          {/* Glowing Effect Cards */}
          <div className="mt-16 w-full max-w-6xl mx-auto px-4">
            <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
              <GridItem
                area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
                icon={<Sparkles className="h-4 w-4 text-purple-400" />}
                title="Latest Updates Daily"
                description="Get the newest chapters as soon as they're released. Never miss an update."
                imageSrc={reze}
              />

              <GridItem
                area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
                icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
                title="Trending Series"
                description="Discover what's hot right now in the cultivation world."
                imageSrc={yuji}
              />

              <GridItem
                area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/9]"
                icon={<Zap className="h-4 w-4 text-purple-400" />}
                title="Fast & Smooth Reading"
                description="Optimized for speed with beautiful layouts and instant loading."
                imageSrc={maki}
              />

              <GridItem
                area="md:[grid-area:2/7/3/13] xl:[grid-area:1/9/2/13]"
                icon={<Star className="h-4 w-4 text-purple-400" />}
                title="Curated Collection"
                description="Hand-picked titles featuring the best cultivation stories."
                imageSrc={zf}
              />

              <GridItem
                area="md:[grid-area:3/1/4/13] xl:[grid-area:2/9/3/13]"
                icon={<BookOpen className="h-4 w-4 text-purple-400" />}
                title="Multiple Languages"
                description="Read in English with high-quality translations."
                imageSrc={ichigo}
              />
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  imageSrc?: string | StaticImageData;
}

const GridItem = ({ area, icon, title, description, imageSrc }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-gray-500/20 bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6">
          {imageSrc && (
            <div className="absolute inset-0 opacity-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={typeof imageSrc === "string" ? imageSrc : imageSrc.src}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg  bg-purple-500/10 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="font-sans text-xl/[1.375rem] font-semibold text-purple-100 md:text-2xl/[1.875rem]">
                {title}
              </h3>
              <p className="font-sans text-sm/[1.125rem] text-neutral-400 md:text-base/[1.375rem]">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

interface StatCounterProps {
  value: number;
  suffix: string;
  label: string;
}

const StatCounter = ({ value, suffix, label }: StatCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = value / 30; // 30 steps
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center relative z-100">
      <div className="flex items-baseline justify-center gap-1 mb-2">
        <span className="text-4xl md:text-5xl font-bold text-white animate-[digit-roll_0.8s_ease-out]" 
              style={{ 
                textShadow: "0 2px 10px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.3)" 
              }}>
          {displayValue}
        </span>
        <span className="text-3xl md:text-4xl font-bold text-purple-400">
          {suffix}
        </span>
      </div>
      <p className="text-sm text-neutral-400 font-medium tracking-wide">{label}</p>
    </div>
  );
};
