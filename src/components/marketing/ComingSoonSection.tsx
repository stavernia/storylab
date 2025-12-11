import { Clock, Sparkles, TrendingUp, Zap } from "lucide-react";

export function ComingSoonSection() {
  const features = [
    {
      icon: Clock,
      title: "Dynamic Timeline Slider",
      description:
        "Scrub through your story to see character state, knowledge, and locations at any moment.",
    },
    {
      icon: Sparkles,
      title: "Foreshadow & Payoff Mapper",
      description:
        "Visualize setups and resolutions, and catch dangling threads.",
    },
    {
      icon: TrendingUp,
      title: "Character & Theme Evolution",
      description: "Track emotional changes, arcs, and motivations over time.",
    },
    {
      icon: Zap,
      title: "Narrative Heatmaps",
      description: "Identify pacing issues and emotional hotspots instantly.",
    },
  ];

  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">
            Coming soon
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            We&apos;re building a full story analysis engine. Here&apos;s
            what&apos;s next.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-[0_15px_45px_-30px_rgba(0,0,0,0.8)]"
              >
                <div className="absolute right-4 top-4 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Coming soon
                </div>
                <div className="mb-4 inline-flex rounded-lg bg-slate-800/50 p-3 text-slate-400">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
