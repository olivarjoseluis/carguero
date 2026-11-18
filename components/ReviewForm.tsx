"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { submitReview } from "@/app/r/[token]/actions";
import { Star } from "./icons";
import { TURNSTILE_SITE_KEY, Turnstile, type TurnstileHandle } from "./Turnstile";

const LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
const GOOD = ["Puntual", "Cuidadoso con la carga", "Buen precio", "Ayudó a cargar", "Amable", "Vehículo en buen estado"];
const BAD = ["Llegó tarde", "Cobró más de lo acordado", "Maltrató la carga", "Poco amable", "No respondió a tiempo"];

export function ReviewForm({ token, driverName, initialStars }: { token: string; driverName: string; initialStars: number }) {
  const [stars, setStars] = useState(initialStars);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [captcha, setCaptcha] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);
  const firstName = driverName.split(" ")[0];
  const good = stars >= 4;

  const pickStars = (n: number) => {
    if ((n >= 4) !== (stars >= 4)) setTags([]);
    setStars(n);
  };
  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const send = () => start(async () => {
    const res = await submitReview({ token, stars, tags, comment, captcha });
    turnstile.current?.reset(); // El token de Turnstile sirve una sola vez
    setResult(res.status);
  });

  if (result === "ok") {
    return (
      <div className="flex flex-col gap-[22px] pt-6" role="status">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent">
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h1 className="m-0 font-display text-[32px] font-bold leading-[1.1] tracking-[-0.025em]">¡Gracias! Tu reseña ya está en el perfil de {firstName}.</h1>
        <div className="flex flex-col gap-2 rounded-2xl bg-paper p-4">
          <span className="text-base font-semibold">{"★".repeat(stars)}  {LABELS[stars]}</span>
          {tags.length > 0 && <span className="text-sm text-muted">{tags.join(" · ")}</span>}
          {comment.trim() && <span className="text-[15px] leading-normal text-[#333]">“{comment.trim()}”</span>}
        </div>
        <Link href="/" className="flex h-14 items-center justify-center rounded-[14px] bg-black text-[17px] font-semibold text-white no-underline">Buscar otro carguero</Link>
        <Link href="/registro" className="p-3 text-center text-[15px] font-semibold text-black">¿Tienes motocarro? Regístrate gratis</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.025em]">¿Cómo te fue con {firstName}?</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">Tu opinión ayuda a tus vecinos a escoger bien.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div role="radiogroup" aria-label="Calificación de 1 a 5 estrellas" className="flex justify-between gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n} type="button" role="radio" aria-checked={n === stars} aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}, ${LABELS[n].toLowerCase()}`}
              onClick={() => pickStars(n)}
              className={`flex h-16 flex-1 cursor-pointer items-center justify-center rounded-[14px] border-0 transition-colors ${n <= stars ? "bg-accent-soft" : "bg-chip"}`}
            >
              <Star size={34} filled={n <= stars} color={n <= stars ? "var(--color-accent)" : "#8a8a8a"} />
            </button>
          ))}
        </div>
        <span className="min-h-[22px] text-center text-[15px] font-semibold">{stars ? LABELS[stars] : "Toca una estrella"}</span>
      </div>

      {stars > 0 && (
        <>
          <div className="flex flex-col gap-2.5">
            <span id="lbl-tags" className="text-[15px] font-semibold">{good ? "¿Qué fue lo mejor?" : "¿Qué se puede mejorar?"}</span>
            <div role="group" aria-labelledby="lbl-tags" className="flex flex-wrap gap-2">
              {(good ? GOOD : BAD).map((t) => (
                <button
                  key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}
                  className={`h-11 cursor-pointer rounded-full border px-4 text-[15px] font-medium ${tags.includes(t) ? "border-black bg-black text-white" : "border-[#d6d6d6] bg-white text-black"}`}
                >{t}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="comentario" className="text-[15px] font-semibold">Cuéntanos más <span className="font-normal text-muted">(opcional)</span></label>
            <textarea
              id="comentario" rows={4} maxLength={280} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué llevó? ¿Llegó a tiempo? ¿Lo recomiendas?"
              className="w-full resize-y rounded-[14px] border border-[#d6d6d6] bg-white px-4 py-3.5 text-base leading-normal text-black"
            />
            <span className="text-right text-[13px] text-muted">{comment.length}/280</span>
          </div>
        </>
      )}

      {result && result !== "ok" && (
        <p role="alert" className="m-0 rounded-xl bg-accent-soft px-4 py-3.5 text-[15px] font-medium text-[#8a2a06]">
          {result === "used" ? "Este servicio ya fue calificado."
            : result === "expired" ? "El enlace venció."
            : result === "captcha" ? "No pudimos confirmar que eres una persona. Espera la verificación e intenta de nuevo."
            : "No pudimos publicar la reseña. Intenta de nuevo."}
        </p>
      )}

      {stars > 0 && <Turnstile ref={turnstile} action="review" onToken={setCaptcha} />}

      <div className="flex flex-col gap-3">
        <button
          type="button" onClick={send} disabled={!stars || pending || (!!TURNSTILE_SITE_KEY && !captcha)}
          className="h-14 cursor-pointer rounded-[14px] border-0 bg-accent text-[17px] font-bold text-black disabled:cursor-not-allowed disabled:bg-[#e2e2e2] disabled:text-[#6b6b6b]"
        >{pending ? "Publicando…" : "Publicar reseña"}</button>
        <span className="text-center text-[13px] leading-normal text-muted">
          Se publica como «Cliente verificado». Este enlace sirve para una sola reseña y vence 14 días después del contacto.
        </span>
      </div>
    </div>
  );
}
