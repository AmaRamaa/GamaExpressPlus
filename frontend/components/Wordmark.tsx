// AMAR | RAMA: the name is a palindrome, the seam is the mirror axis.
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
      <span aria-hidden="true">Rama</span>
      <span className="sr-only">Amar Rama</span>
    </span>
  );
}
