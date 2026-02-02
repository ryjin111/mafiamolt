type SpriteProps = {
  size?: number
  className?: string
}

// The Don - Ruthless boss in pinstripe suit with cigar
export function RuthlessMafia({ size = 48, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
      {/* Hat */}
      <ellipse cx="32" cy="14" rx="18" ry="4" fill="#1a1a1a" />
      <path d="M16 14 L20 6 L44 6 L48 14" fill="#1a1a1a" />
      <rect x="20" y="6" width="24" height="8" fill="#1a1a1a" />
      <rect x="28" y="8" width="8" height="2" fill="#c9a227" />

      {/* Head */}
      <ellipse cx="32" cy="20" rx="10" ry="8" fill="#e8c4a0" />
      {/* Angry eyes */}
      <ellipse cx="28" cy="19" rx="2" ry="1.5" fill="#1a1a1a" />
      <ellipse cx="36" cy="19" rx="2" ry="1.5" fill="#1a1a1a" />
      {/* Eyebrows - angry */}
      <path d="M25 16 L30 17" stroke="#4a3728" strokeWidth="1.5" />
      <path d="M34 17 L39 16" stroke="#4a3728" strokeWidth="1.5" />
      {/* Scar */}
      <path d="M38 17 L42 22" stroke="#c9a090" strokeWidth="1" />
      {/* Mouth with cigar */}
      <ellipse cx="32" cy="24" rx="3" ry="1" fill="#8b4513" />
      <rect x="35" y="23" width="10" height="3" rx="1" fill="#8b4513" />
      <circle cx="45" cy="24" r="2" fill="#ff6b35" opacity="0.8" />

      {/* Body - Pinstripe suit */}
      <path d="M20 28 L16 58 L48 58 L44 28 Z" fill="#2a2a2a" />
      {/* Pinstripes */}
      <path d="M22 28 L20 58" stroke="#3a3a3a" strokeWidth="0.5" />
      <path d="M26 28 L24 58" stroke="#3a3a3a" strokeWidth="0.5" />
      <path d="M30 28 L29 58" stroke="#3a3a3a" strokeWidth="0.5" />
      <path d="M34 28 L35 58" stroke="#3a3a3a" strokeWidth="0.5" />
      <path d="M38 28 L40 58" stroke="#3a3a3a" strokeWidth="0.5" />
      <path d="M42 28 L44 58" stroke="#3a3a3a" strokeWidth="0.5" />
      {/* Lapels */}
      <path d="M32 28 L26 40 L32 42 L38 40 L32 28" fill="#1a1a1a" />
      {/* Shirt & tie */}
      <path d="M30 28 L32 42 L34 28" fill="#ffffff" />
      <path d="M31 30 L32 42 L33 30" fill="#8b0000" />
      {/* Gold chain */}
      <path d="M24 35 Q28 38 32 36" stroke="#c9a227" strokeWidth="1.5" fill="none" />

      {/* Arms */}
      <path d="M16 30 L10 50 L14 52 L20 34" fill="#2a2a2a" />
      <path d="M48 30 L54 50 L50 52 L44 34" fill="#2a2a2a" />
      {/* Hands */}
      <ellipse cx="12" cy="51" rx="4" ry="3" fill="#e8c4a0" />
      <ellipse cx="52" cy="51" rx="4" ry="3" fill="#e8c4a0" />
      {/* Gold ring */}
      <circle cx="54" cy="51" r="2" fill="none" stroke="#c9a227" strokeWidth="1" />

      {/* Shoes */}
      <ellipse cx="24" cy="60" rx="6" ry="3" fill="#1a1a1a" />
      <ellipse cx="40" cy="60" rx="6" ry="3" fill="#1a1a1a" />
    </svg>
  )
}

// The Gentleman - Honorable with top hat and cane
export function HonorableMafia({ size = 48, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
      {/* Top Hat */}
      <rect x="22" y="2" width="20" height="12" fill="#1a1a1a" />
      <ellipse cx="32" cy="14" rx="14" ry="3" fill="#1a1a1a" />
      <rect x="24" y="10" width="16" height="2" fill="#c9a227" />

      {/* Monocle */}
      <circle cx="38" cy="20" r="4" fill="none" stroke="#c9a227" strokeWidth="1" />
      <path d="M42 20 L48 16" stroke="#c9a227" strokeWidth="0.5" />

      {/* Head */}
      <ellipse cx="32" cy="22" rx="10" ry="8" fill="#e8c4a0" />
      {/* Eyes */}
      <ellipse cx="28" cy="21" rx="2" ry="2" fill="#1a1a1a" />
      <ellipse cx="38" cy="21" rx="2" ry="2" fill="#1a1a1a" />
      {/* Mustache */}
      <path d="M26 26 Q32 30 38 26" stroke="#4a3728" strokeWidth="2" fill="none" />
      <path d="M26 26 Q24 25 22 26" stroke="#4a3728" strokeWidth="1.5" fill="none" />
      <path d="M38 26 Q40 25 42 26" stroke="#4a3728" strokeWidth="1.5" fill="none" />

      {/* Body - Fine suit */}
      <path d="M20 30 L18 58 L46 58 L44 30 Z" fill="#2c3e50" />
      {/* Lapels */}
      <path d="M32 30 L24 42 L32 44 L40 42 L32 30" fill="#1a252f" />
      {/* Vest */}
      <path d="M26 34 L26 50 L38 50 L38 34" fill="#8b0000" />
      {/* Shirt */}
      <path d="M30 30 L32 44 L34 30" fill="#ffffff" />
      {/* Bow tie */}
      <path d="M28 32 L32 34 L36 32 L32 36 Z" fill="#1a1a1a" />
      {/* Pocket watch chain */}
      <path d="M30 40 Q28 44 32 46" stroke="#c9a227" strokeWidth="1" fill="none" />
      <circle cx="32" cy="47" r="2" fill="#c9a227" />

      {/* Arms */}
      <path d="M18 32 L8 52 L12 54 L20 36" fill="#2c3e50" />
      <path d="M46 32 L54 48 L50 50 L44 36" fill="#2c3e50" />
      {/* Gloved hands */}
      <ellipse cx="10" cy="53" rx="4" ry="3" fill="#ffffff" />
      <ellipse cx="52" cy="49" rx="4" ry="3" fill="#ffffff" />

      {/* Cane */}
      <rect x="6" y="40" width="2" height="22" fill="#4a3728" />
      <ellipse cx="7" cy="40" rx="3" ry="2" fill="#c9a227" />

      {/* Shoes - polished */}
      <ellipse cx="26" cy="60" rx="6" ry="3" fill="#1a1a1a" />
      <ellipse cx="38" cy="60" rx="6" ry="3" fill="#1a1a1a" />
      <path d="M22 59 L24 59" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
      <path d="M34 59 L36 59" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )
}

// The Joker - Chaotic wildcard with flashy suit
export function ChaoticMafia({ size = 48, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
      {/* Wild hair */}
      <path d="M20 16 Q18 8 24 10 Q22 4 30 8 Q32 2 38 8 Q44 4 42 12 Q48 10 44 18" fill="#4a0080" />

      {/* Head */}
      <ellipse cx="32" cy="22" rx="11" ry="9" fill="#e8c4a0" />
      {/* Crazy eyes */}
      <ellipse cx="27" cy="20" rx="3" ry="3" fill="#ffffff" />
      <ellipse cx="37" cy="20" rx="3" ry="3" fill="#ffffff" />
      <ellipse cx="28" cy="20" rx="2" ry="2" fill="#1a1a1a" />
      <ellipse cx="36" cy="20" rx="2" ry="2" fill="#1a1a1a" />
      {/* Raised eyebrows */}
      <path d="M24 15 Q27 13 30 15" stroke="#4a0080" strokeWidth="1.5" fill="none" />
      <path d="M34 15 Q37 13 40 15" stroke="#4a0080" strokeWidth="1.5" fill="none" />
      {/* Wide grin */}
      <path d="M24 26 Q32 32 40 26" stroke="#8b0000" strokeWidth="2" fill="none" />
      <path d="M26 26 L26 28" stroke="#ffffff" strokeWidth="1" />
      <path d="M32 27 L32 29" stroke="#ffffff" strokeWidth="1" />
      <path d="M38 26 L38 28" stroke="#ffffff" strokeWidth="1" />

      {/* Body - Purple & green suit */}
      <path d="M18 30 L14 58 L50 58 L46 30 Z" fill="#4a0080" />
      {/* Question marks pattern */}
      <text x="22" y="42" fill="#c9a227" fontSize="8" fontFamily="serif">?</text>
      <text x="36" y="50" fill="#c9a227" fontSize="8" fontFamily="serif">?</text>
      {/* Green vest */}
      <path d="M26 32 L26 52 L38 52 L38 32" fill="#228b22" />
      {/* Shirt with playing cards */}
      <path d="M30 30 L32 46 L34 30" fill="#ffffff" />
      {/* Wild tie */}
      <path d="M31 32 L32 50 L33 32" fill="#ff6b35" />
      <circle cx="32" cy="36" r="2" fill="#ffff00" />
      <circle cx="32" cy="42" r="2" fill="#ff00ff" />

      {/* Arms spread out */}
      <path d="M18 32 L4 44 L8 48 L20 38" fill="#4a0080" />
      <path d="M46 32 L60 44 L56 48 L44 38" fill="#4a0080" />
      {/* Hands with playing cards */}
      <ellipse cx="6" cy="46" rx="4" ry="3" fill="#e8c4a0" />
      <ellipse cx="58" cy="46" rx="4" ry="3" fill="#e8c4a0" />
      {/* Cards in hands */}
      <rect x="58" y="42" width="4" height="6" fill="#ffffff" stroke="#1a1a1a" strokeWidth="0.5" transform="rotate(20 60 45)" />

      {/* Shoes - mismatched */}
      <ellipse cx="24" cy="60" rx="6" ry="3" fill="#4a0080" />
      <ellipse cx="40" cy="60" rx="6" ry="3" fill="#228b22" />
    </svg>
  )
}

// The Shadow - Silent assassin in dark attire
export function SilentMafia({ size = 48, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
      {/* Hood/mask */}
      <path d="M20 8 Q32 4 44 8 L46 26 Q32 30 18 26 Z" fill="#0a0a0a" />

      {/* Face - mostly hidden */}
      <ellipse cx="32" cy="20" rx="8" ry="6" fill="#1a1a1a" />
      {/* Eyes only visible - glowing */}
      <ellipse cx="28" cy="19" rx="2" ry="1" fill="#00ff88" opacity="0.9" />
      <ellipse cx="36" cy="19" rx="2" ry="1" fill="#00ff88" opacity="0.9" />
      {/* Eye glow */}
      <ellipse cx="28" cy="19" rx="3" ry="2" fill="#00ff88" opacity="0.2" />
      <ellipse cx="36" cy="19" rx="3" ry="2" fill="#00ff88" opacity="0.2" />

      {/* Scarf/mask */}
      <path d="M22 22 Q32 28 42 22 L44 30 Q32 34 20 30 Z" fill="#1a1a1a" />

      {/* Body - Dark coat */}
      <path d="M16 28 L12 60 L52 60 L48 28 Z" fill="#0a0a0a" />
      {/* Coat details */}
      <path d="M32 28 L32 60" stroke="#1a1a1a" strokeWidth="2" />
      <path d="M24 36 L24 40" stroke="#2a2a2a" strokeWidth="1" />
      <path d="M40 36 L40 40" stroke="#2a2a2a" strokeWidth="1" />
      {/* Belt with knife */}
      <rect x="20" y="44" width="24" height="3" fill="#2a2a2a" />
      <rect x="22" y="43" width="2" height="5" fill="#4a4a4a" />
      {/* Hidden blade handle */}
      <rect x="38" y="42" width="2" height="8" fill="#4a4a4a" />
      <path d="M39 50 L39 56" stroke="#c0c0c0" strokeWidth="1" />

      {/* Arms - ready to strike */}
      <path d="M16 30 L6 46 L10 48 L18 34" fill="#0a0a0a" />
      <path d="M48 30 L56 42 L52 44 L46 34" fill="#0a0a0a" />
      {/* Gloved hands */}
      <ellipse cx="8" cy="47" rx="4" ry="3" fill="#1a1a1a" />
      <ellipse cx="54" cy="43" rx="4" ry="3" fill="#1a1a1a" />

      {/* Throwing knife in hand */}
      <path d="M54 38 L58 32" stroke="#c0c0c0" strokeWidth="1.5" />
      <path d="M58 32 L60 30" stroke="#c0c0c0" strokeWidth="1" />

      {/* Feet - silent */}
      <ellipse cx="24" cy="62" rx="5" ry="2" fill="#0a0a0a" />
      <ellipse cx="40" cy="62" rx="5" ry="2" fill="#0a0a0a" />
    </svg>
  )
}

// The Soldier - Default mobster
export function DefaultMafia({ size = 48, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
      {/* Fedora */}
      <ellipse cx="32" cy="12" rx="16" ry="4" fill="#2c2c2c" />
      <path d="M18 12 L22 4 L42 4 L46 12" fill="#2c2c2c" />
      <rect x="22" y="4" width="20" height="8" fill="#2c2c2c" />
      <rect x="26" y="6" width="12" height="2" fill="#1a1a1a" />

      {/* Head */}
      <ellipse cx="32" cy="20" rx="10" ry="8" fill="#e8c4a0" />
      {/* 5 o'clock shadow */}
      <ellipse cx="32" cy="24" rx="8" ry="5" fill="#d4b08c" opacity="0.5" />
      {/* Eyes */}
      <ellipse cx="28" cy="19" rx="2" ry="2" fill="#1a1a1a" />
      <ellipse cx="36" cy="19" rx="2" ry="2" fill="#1a1a1a" />
      {/* Thick eyebrows */}
      <path d="M25 16 L31 17" stroke="#4a3728" strokeWidth="2" />
      <path d="M33 17 L39 16" stroke="#4a3728" strokeWidth="2" />
      {/* Nose */}
      <path d="M32 20 L31 24 L33 24" stroke="#d4a574" strokeWidth="1" fill="none" />
      {/* Mouth - slight frown */}
      <path d="M28 26 Q32 25 36 26" stroke="#8b4513" strokeWidth="1.5" fill="none" />

      {/* Body - Classic suit */}
      <path d="M20 28 L18 58 L46 58 L44 28 Z" fill="#2c2c2c" />
      {/* Lapels */}
      <path d="M32 28 L26 42 L32 44 L38 42 L32 28" fill="#1a1a1a" />
      {/* Shirt */}
      <path d="M30 28 L32 44 L34 28" fill="#d4d4d4" />
      {/* Tie */}
      <path d="M31 32 L32 48 L33 32" fill="#1a1a1a" />
      <path d="M30 32 L32 34 L34 32" fill="#1a1a1a" />
      {/* Pocket square */}
      <path d="M24 36 L22 40 L26 40" fill="#d4d4d4" />

      {/* Arms */}
      <path d="M18 30 L10 50 L14 52 L20 34" fill="#2c2c2c" />
      <path d="M46 30 L54 50 L50 52 L44 34" fill="#2c2c2c" />
      {/* Hands */}
      <ellipse cx="12" cy="51" rx="4" ry="3" fill="#e8c4a0" />
      <ellipse cx="52" cy="51" rx="4" ry="3" fill="#e8c4a0" />

      {/* Shoes */}
      <ellipse cx="26" cy="60" rx="6" ry="3" fill="#1a1a1a" />
      <ellipse cx="38" cy="60" rx="6" ry="3" fill="#1a1a1a" />
    </svg>
  )
}

// Map of personas to components for easy access
export const MAFIA_SPRITES = {
  ruthless: RuthlessMafia,
  honorable: HonorableMafia,
  chaotic: ChaoticMafia,
  silent: SilentMafia,
  default: DefaultMafia,
} as const

export type PersonaType = keyof typeof MAFIA_SPRITES
