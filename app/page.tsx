"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { product } from "@/lib/config";

const modules = [
  {
    id: "food",
    n: "01",
    name: "Food",
    desc: "Plan meals, save recipes, track the grocery run.",
    live: "Tue — Lentil soup",
    accent: "#FF7A59",
    accentSoft: "rgba(255,122,89,0.14)",
  },
  {
    id: "finance",
    n: "02",
    name: "Finance",
    desc: "See what came in, what went out, what's left.",
    live: "This month — $860 left",
    accent: "#43D9A3",
    accentSoft: "rgba(67,217,163,0.14)",
  },
  {
    id: "future",
    n: "03",
    name: "Future",
    desc: "Simple plans and to-dos for what's coming next.",
    live: "Next — Renew passport",
    accent: "#8C7CFF",
    accentSoft: "rgba(140,124,255,0.14)",
  },
] as const;

const connections = [
  { from: "food", text: "A grocery run logged in Food shows up as a line item in Finance." },
  { from: "finance", text: "A savings goal in Finance turns into a plan on your list in Future." },
  { from: "future", text: "A free evening in Future becomes a slot for a meal plan in Food." },
] as const;

function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(el);
          }
        },
        { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function Home() {
  const heroReveal = useInView<HTMLDivElement>(0.1);
  const connectReveal = useInView<HTMLDivElement>(0.3);

  return (
      <main className="mx-auto flex max-w-5xl flex-col overflow-hidden px-6">
        {/* Hero */}
        <section className="relative flex min-h-[70vh] flex-col justify-center gap-8 py-24">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="blob blob--coral" />
            <div className="blob blob--mint" />
            <div className="blob blob--violet" />
          </div>

          <p className="text-sm text-[#8B8B90]">{product.tagline}</p>

          <div ref={heroReveal.ref} className={`reveal-clip ${heroReveal.inView ? "is-visible" : ""}`}>
            <h1 className="font-display max-w-2xl text-5xl font-medium leading-[0.97] tracking-tight text-[#F3F2EE] sm:text-7xl">
              You don&apos;t manage three apps.
              <br />
              You run <span className="gradient-text">one life</span>.
            </h1>
          </div>

          <p className="max-w-md text-base leading-relaxed text-[#9A9AA0]">
            {product.description}
          </p>

          <div className="mt-2 flex items-center gap-5">
            <Link
                href="/signup"
                className="rounded-full bg-[#F3F2EE] px-6 py-2.5 text-sm text-[#0B0B0C] transition-transform hover:-translate-y-0.5 hover:opacity-90"
            >
              Get started
            </Link>
            <Link
                href="/signin"
                className="text-sm text-[#9A9AA0] transition-colors hover:text-[#F3F2EE]"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Marquee */}
        <div className="-mx-6 overflow-hidden border-y border-[#2A2A2E] bg-[#111113] py-5">
          <div className="marquee">
            {Array.from({ length: 2 }).map((_, i) => (
                <span
                    key={i}
                    className="font-display flex items-center whitespace-nowrap px-4 text-2xl font-medium tracking-tight sm:text-3xl"
                >
              <span style={{ color: modules[0].accent }}>Food</span>
              <span className="mx-4 text-[#3A3A3F]">—</span>
              <span style={{ color: modules[1].accent }}>Finance</span>
              <span className="mx-4 text-[#3A3A3F]">—</span>
              <span style={{ color: modules[2].accent }}>Future</span>
              <span className="mx-4 text-[#3A3A3F]">—</span>
            </span>
            ))}
          </div>
        </div>

        {/* Modules */}
        <section className="flex flex-col py-4">
          <p className="pt-16 text-sm text-[#6A6A70]">Modules/</p>
          <div>
            {modules.map((m) => (
                <ModuleRow key={m.id} module={m} />
            ))}
          </div>
        </section>

        {/* How it connects */}
        <section className="flex flex-col gap-10 py-24">
          <p className="text-sm text-[#6A6A70]">How it connects/</p>

          <div ref={connectReveal.ref}>
            <svg
                viewBox="0 0 300 260"
                className={`mx-auto w-full max-w-xs connect-svg ${connectReveal.inView ? "is-visible" : ""}`}
                fill="none"
            >
              <polygon
                  points="150,20 270,220 30,220"
                  className="connect-line"
                  stroke="url(#connectGradient)"
                  strokeWidth="2"
                  strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="connectGradient" x1="0" y1="0" x2="300" y2="260">
                  <stop offset="0%" stopColor="#FF7A59" />
                  <stop offset="50%" stopColor="#43D9A3" />
                  <stop offset="100%" stopColor="#8C7CFF" />
                </linearGradient>
              </defs>
              {[
                { x: 150, y: 20, color: "#8C7CFF", label: "Future" },
                { x: 270, y: 220, color: "#FF7A59", label: "Food" },
                { x: 30, y: 220, color: "#43D9A3", label: "Finance" },
              ].map((node) => (
                  <g key={node.label}>
                    <circle cx={node.x} cy={node.y} r="7" fill={node.color} />
                    <text
                        x={node.x}
                        y={node.y < 100 ? node.y - 16 : node.y + 24}
                        textAnchor="middle"
                        className="fill-[#9A9AA0] text-[11px]"
                    >
                      {node.label}
                    </text>
                  </g>
              ))}
            </svg>
          </div>

          <div className="flex flex-col">
            {connections.map((c, i) => {
              const fromM = modules.find((m) => m.id === c.from)!;
              return (
                  <p
                      key={i}
                      className="border-t border-[#2A2A2E] py-5 text-lg leading-relaxed text-[#F3F2EE] first:border-t-0 sm:text-xl"
                  >
                <span
                    className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: fromM.accent }}
                />
                    {c.text}
                  </p>
              );
            })}
          </div>
        </section>
      </main>
  );
}

function ModuleRow({ module }: { module: (typeof modules)[number] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);

  return (
      <div
          ref={ref}
          className={`module-row group -mx-6 flex flex-col gap-3 border-b border-[#2A2A2E] px-6 py-10 transition-colors sm:flex-row sm:items-baseline sm:justify-between ${
              inView ? "is-active" : ""
          }`}
          style={
            {
              "--accent": module.accent,
              "--accent-soft": module.accentSoft,
            } as React.CSSProperties
          }
      >
        <div className="flex items-baseline gap-6">
          <span className="text-sm tabular-nums text-[#6A6A70]">{module.n}</span>
          <h3 className="font-display module-name text-3xl font-medium tracking-tight sm:text-4xl">
            {module.name}
          </h3>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <p className="max-w-sm text-sm leading-relaxed text-[#9A9AA0] sm:text-right">
            {module.desc}
          </p>
          <p className="text-xs font-medium" style={{ color: module.accent }}>
            {module.live}
          </p>
        </div>
      </div>
  );
}