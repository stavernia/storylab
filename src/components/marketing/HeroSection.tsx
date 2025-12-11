import { Button } from "@/components/ui/button";
import { BookOpenText, LayoutGrid } from "lucide-react";

export function HeroSection() {
  const handleWaitlistClick = () => {
    // TODO: Implement waitlist submission
    console.log("Join waitlist clicked");
  };

  const handleSeeActionClick = () => {
    // TODO: Implement demo scroll or modal
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pb-20 pt-16 lg:pb-32 lg:pt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                The story structure workspace for serious writers.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
                Outline, draft, and analyze your novel in a calm, visual
                environment that reveals arcs, themes, pacing, and threads as
                you write.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={handleWaitlistClick}
                size="lg"
                className="w-full bg-cyan-400 text-slate-950 shadow-[0_15px_50px_-20px_rgba(34,211,238,0.65)] transition hover:bg-cyan-300 sm:w-auto"
              >
                Join the Alpha Waitlist
              </Button>
              <Button
                onClick={handleSeeActionClick}
                size="lg"
                variant="ghost"
                className="w-full text-slate-200 hover:bg-slate-800/50 hover:text-white sm:w-auto"
              >
                See it in action
              </Button>
            </div>
          </div>

          {/* Placeholder Swimlane Grid Mockup */}
          <div className="relative">
            <div
              className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 p-8 shadow-[0_30px_100px_-50px_rgba(0,0,0,0.9)]">
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex gap-3">
                  <div className="h-10 w-24 rounded-lg bg-slate-800/60" />
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 flex-1 rounded-lg bg-slate-800/40"
                    />
                  ))}
                </div>

                {/* Content rows (swimlanes) */}
                {[...Array(4)].map((_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-3">
                    <div className="flex h-12 w-24 items-center rounded-lg bg-slate-800/60 px-2">
                      <div className="h-2 w-full rounded bg-slate-700/60" />
                    </div>
                    {[...Array(5)].map((_, colIdx) => (
                      <div
                        key={colIdx}
                        className="flex h-12 flex-1 items-center justify-center rounded-lg bg-slate-800/30"
                      >
                        {Math.random() > 0.5 && (
                          <div
                            className="h-8 w-8 rounded-md"
                            style={{
                              backgroundColor: `hsl(${180 + rowIdx * 30}, 60%, ${40 + colIdx * 5}%)`,
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Floating label */}
              <div className="absolute right-4 top-4 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Story Grid
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
