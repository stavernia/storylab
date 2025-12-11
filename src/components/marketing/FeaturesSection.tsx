import { LayoutGrid, FileEdit, Layers } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      title: "See your entire story at a glance.",
      description:
        "Track arcs, themes, tension, and character presence across chapters. The Story Grid gives you a visual map of every thread, helping you plan and revise with confidence.",
      imageSide: "right" as const,
      visual: <StoryGridMockup />,
    },
    {
      title: "Draft with structure built in.",
      description:
        "Your outline, notes, and manuscript stay in sync. Reorganize chapters, move scenes, and evolve your story without losing momentum.",
      imageSide: "left" as const,
      visual: <ManuscriptMockup />,
    },
    {
      title: "Plan beats with clarity and flexibility.",
      description:
        "Use cards, tags, and filters to organize beats and research. Every update reflects instantly in your outline and grid.",
      imageSide: "right" as const,
      visual: <CorkboardMockup />,
    },
  ];

  return (
    <section id="features" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl space-y-24 px-6 lg:space-y-32">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              feature.imageSide === "left" ? "lg:flex-row-reverse" : ""
            }`}
          >
            {feature.imageSide === "left" && (
              <div className="order-1 lg:order-2">{feature.visual}</div>
            )}
            <div
              className={
                feature.imageSide === "left" ? "order-2 lg:order-1" : ""
              }
            >
              <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">
                {feature.title}
              </h2>
              <p className="text-lg leading-relaxed text-slate-300">
                {feature.description}
              </p>
            </div>
            {feature.imageSide === "right" && <div>{feature.visual}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// Mockup Components
function StoryGridMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <LayoutGrid className="h-4 w-4" />
          Story Grid
        </div>
        <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          4 Themes · 12 Chapters
        </div>
      </div>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex gap-2">
          <div className="h-8 w-32 rounded bg-slate-800/50" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 flex-1 rounded bg-slate-800/30" />
          ))}
        </div>
        {/* Rows */}
        {[...Array(4)].map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-2">
            <div className="h-10 w-32 rounded bg-slate-800/50" />
            {[...Array(6)].map((_, colIdx) => (
              <div
                key={colIdx}
                className="flex h-10 flex-1 items-center justify-center rounded bg-slate-800/20"
              >
                {Math.random() > 0.4 && (
                  <div
                    className="h-6 w-6 rounded"
                    style={{
                      backgroundColor: `hsl(${180 + rowIdx * 40}, 65%, ${45 + colIdx * 3}%)`,
                      opacity: 0.7,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ManuscriptMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 shadow-2xl">
      <div className="grid lg:grid-cols-[240px_1fr]">
        {/* Left: Binder/Outline */}
        <div className="border-r border-slate-800/70 bg-slate-950/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FileEdit className="h-3 w-3" />
            Outline
          </div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1.5 text-xs ${
                  i === 2
                    ? "bg-cyan-500/15 text-cyan-200"
                    : "bg-slate-800/40 text-slate-400"
                }`}
              >
                <div className="h-2 w-full rounded bg-current opacity-40" />
              </div>
            ))}
          </div>
        </div>
        {/* Right: Manuscript */}
        <div className="p-6">
          <div className="mb-4 text-sm font-semibold text-slate-200">
            Chapter 3
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-2 rounded bg-slate-700/40" />
                <div
                  className="h-2 rounded bg-slate-700/40"
                  style={{ width: `${85 + Math.random() * 15}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CorkboardMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Layers className="h-4 w-4" />
          Corkboard
        </div>
        <div className="flex gap-2">
          {["Plot", "Character", "Research"].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-800/60 px-2 py-1 text-xs text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3"
          >
            <div className="mb-2 h-2 w-3/4 rounded bg-slate-600/50" />
            <div className="space-y-1">
              <div className="h-1.5 rounded bg-slate-700/40" />
              <div className="h-1.5 w-5/6 rounded bg-slate-700/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
