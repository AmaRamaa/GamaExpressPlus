// A stylized, dark "exploded parts" line-art illustration -- headlight,
// front bumper/grille, a door panel, and a side-skirt strip -- standing in
// for a hero photograph we don't have. Communicates the breadth of exterior
// parts (front + side, not just one angle) without needing real photography.
export default function HeroPartsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 700 520" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="doorFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Door panel -- bleeds off the left edge, subtle body crease */}
      <path d="M-40,90 L260,60 Q300,58 300,100 L300,430 Q300,470 260,472 L-40,490 Z" fill="url(#doorFade)" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M0,230 L280,215" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1.5" />
      <circle cx="235" cy="255" r="5" stroke="#DC2626" strokeWidth="1.5" strokeOpacity="0.7" />

      {/* Side skirt strip along the bottom */}
      <path d="M40,460 L560,415 L560,445 L40,492 Z" fill="#FFFFFF" fillOpacity="0.04" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1.5" />

      {/* Front bumper / grille, lower-mid-right */}
      <path
        d="M340,340 Q360,300 460,290 Q560,282 610,320 Q625,345 610,380 Q560,410 460,412 Q380,410 350,385 Q335,365 340,340 Z"
        fill="#FFFFFF" fillOpacity="0.03" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1.5"
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={380 + i * 35} y1={315} x2={378 + i * 35} y2={385} stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="2" />
      ))}

      {/* Headlight, upper-right -- angular, with a glow and light-beam streaks */}
      <path
        d="M420,120 L600,95 Q630,92 632,120 L636,175 Q638,200 610,205 L470,225 Q440,228 435,200 Z"
        fill="#FFFFFF" fillOpacity="0.05" stroke="#DC2626" strokeOpacity="0.8" strokeWidth="2"
      />
      <ellipse cx="560" cy="150" rx="55" ry="30" fill="url(#glow)" opacity="0.5" />
      <path d="M0,150 L560,150" stroke="url(#beam)" strokeWidth="3" />
      <path d="M0,175 L555,168" stroke="url(#beam)" strokeWidth="1.5" opacity="0.6" />

      {/* Faint accent diagonal, echoing the brand's red corner cut */}
      <path d="M650,0 L700,0 L700,520 L600,520 Z" fill="#DC2626" fillOpacity="0.06" />
    </svg>
  );
}
