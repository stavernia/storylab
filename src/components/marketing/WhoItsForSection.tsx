import { Check } from "lucide-react";

export function WhoItsForSection() {
  const audience = [
    "Novelists working on long-form stories",
    "Writers juggling multiple POVs or timelines",
    "Editors and book coaches guiding revision",
    "Creative writing students and instructors",
  ];

  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">
          Built for long-form storytellers.
        </h2>
        <p className="mb-10 text-lg text-slate-300">
          StoryLab is designed for writers who care deeply about structure,
          character, and theme.
        </p>

        <div className="mx-auto max-w-2xl">
          <ul className="space-y-4 text-left">
            {audience.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-slate-800/40 bg-slate-900/40 p-4 text-slate-200 transition hover:border-slate-700/60 hover:bg-slate-900/60"
              >
                <div className="mt-0.5 flex-shrink-0 rounded-full bg-cyan-500/15 p-1">
                  <Check className="h-4 w-4 text-cyan-300" />
                </div>
                <span className="text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
