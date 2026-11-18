import Link from "next/link";
import { Logo } from "./icons";

export function SiteHeader({ variant = "full" }: { variant?: "full" | "minimal" }) {
  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 text-white no-underline">
          <Logo />
          <span className="font-display text-[22px] font-extrabold tracking-[-0.02em]">Carguero</span>
        </Link>
        {variant === "full" ? (
          <nav aria-label="Principal" className="flex flex-wrap items-center justify-end gap-2">
            <a href="/#como-funciona" className="hidden rounded-full px-3.5 py-3 text-[15px] font-medium text-white md:inline">Cómo funciona</a>
            <a href="/#conductores" className="hidden rounded-full px-3.5 py-3 text-[15px] font-medium text-white md:inline">Para conductores</a>
            <a href="/#compra-venta" className="hidden rounded-full px-3.5 py-3 text-[15px] font-medium text-white md:inline">Compra y venta</a>
            <Link href="/registro" className="ml-2 whitespace-nowrap rounded-full bg-white px-[18px] py-3 text-[15px] font-semibold text-black">
              <span className="sm:hidden">Regístrate</span>
              <span className="hidden sm:inline">Registra tu carguero</span>
            </Link>
          </nav>
        ) : (
          <Link href="/" className="rounded-full bg-[#1f1f1f] px-3.5 py-3 text-[15px] font-semibold text-white">Volver al inicio</Link>
        )}
      </div>
    </header>
  );
}
