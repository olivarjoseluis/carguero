import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-6 pb-10 pt-14">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex max-w-[360px] flex-col gap-3">
            <span className="font-display text-2xl font-extrabold tracking-[-0.02em]">Carguero</span>
            <span className="text-[15px] leading-normal text-[#bdbdbd]">El directorio de motocarros y cargueros de Cali y Jamundí.</span>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-12">
            <FooterCol title="Clientes" links={[["/#resultados", "Buscar carguero"], ["/#como-funciona", "Cómo funciona"]]} />
            <FooterCol title="Conductores" links={[["/registro", "Registrarme"], ["/#compra-venta", "Compra y venta"]]} />
            <FooterCol title="Legal" links={[["/privacidad", "Tratamiento de datos (Ley 1581)"], ["/terminos", "Términos de uso"]]} />
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-[#2a2a2a] pt-6 text-[13px] text-[#a6a6a6]">
          <span>Carguero es un directorio. El acuerdo y el pago son entre cliente y conductor.</span>
          <span>Hecho en el Valle del Cauca</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mb-1.5 text-sm font-semibold">{title}</span>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="py-2 text-[15px] text-[#bdbdbd] no-underline hover:text-white">{label}</Link>
      ))}
    </div>
  );
}
