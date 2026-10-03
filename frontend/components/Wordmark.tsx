// AMAR | ЯAMA: the name is a palindrome, the seam is the mirror axis, and the
// right-hand R is the left one flipped. It's the real R glyph mirrored with a
// transform rather than a typed Cyrillic "Я", because the site font is loaded
// for Latin only and a typed Я would fall back to a different typeface.
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.55em] font-display font-bold uppercase tracking-[0.12em] text-white/80 ${className}`}
    >
      {/* The left word's trailing letter-spacing is cancelled so both gaps around the seam match. */}
      <span aria-hidden="true" className="-mr-[0.12em]">
        Amar
      </span>
      <span
        aria-hidden="true"
        className="h-[1.15em] w-px bg-gradient-to-b from-transparent via-brand-red to-transparent shadow-[0_0_10px_2px_rgb(179_0_0/0.8)]"
      />
      <span aria-hidden="true">
        {/* Flipping the box would also move its trailing letter-spacing to the
            seam side, so the spacing is moved to a margin that the flip leaves alone. */}
        <span className="mr-[0.12em] inline-block -scale-x-100 tracking-normal">R</span>ama
      </span>
      <span className="sr-only">Amar Rama</span>
    </span>
  );
}
