import { BookOpenText, LayoutGrid, Tag, FileEdit } from "lucide-react";

export function ValuePropsSection() {
  const cards = [
    {
      icon: FileEdit,
      title: "Manuscript + Outline",
      description:
        "A synchronized drafting workspace that keeps your outline, chapters, and structure aligned.",
    },
    {
      icon: LayoutGrid,
      title: "Story Grid",
      description:
        "Visualize POV, themes, tension, and character presence chapter-by-chapter.",
    },
    {
      icon: Tag,
      title: "Corkboard + Tags",
      description:
        "Plan beats, tag threads, and organize revisions with flexible drag-and-drop boards.",
    },
    {
      icon: BookOpenText,
      title: "Calm Writing Environment",
      description: "A clean, editorial space designed for clarity and focus.",
    },
  ];

  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Built for long-form stories.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_15px_45px_-30px_rgba(0,0,0,0.8)] transition hover:border-slate-700/80 hover:bg-slate-900/80"
              >
                <div className="mb-4 inline-flex rounded-lg bg-cyan-500/10 p-3 text-cyan-300 transition group-hover:bg-cyan-500/15">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
