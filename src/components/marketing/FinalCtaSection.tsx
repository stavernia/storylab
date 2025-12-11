import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  const handleWaitlistClick = () => {
    // TODO: Implement waitlist submission
    console.log("Join waitlist clicked");
  };

  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-12 shadow-2xl lg:p-16">
          <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            Be one of the first to shape StoryLab.
          </h2>
          <p className="mb-8 text-lg text-slate-300">
            Join the Alpha Waitlist and get early access to powerful story
            structure tools.
          </p>
          <Button
            onClick={handleWaitlistClick}
            size="lg"
            className="bg-cyan-400 text-slate-950 shadow-[0_15px_50px_-20px_rgba(34,211,238,0.65)] transition hover:bg-cyan-300"
          >
            Join the Waitlist
          </Button>
        </div>
      </div>
    </section>
  );
}
