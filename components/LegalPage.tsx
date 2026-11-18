import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-[760px] flex-col gap-5 px-6 py-16 text-[17px] leading-[1.65] [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold">
        <h1 className="m-0 font-display text-[clamp(32px,4vw,44px)] font-bold tracking-[-0.025em]">{title}</h1>
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-[15px] text-[#8a2a06]">
          Borrador. Complétalo con tus datos y revísalo con un abogado antes de publicar.
        </p>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
