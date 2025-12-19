
import React from 'react';

// Format: "typeIndex-skinIndex-eyesIndex-mouthIndex-accessoryIndex"
export const generateRandomAvatar = () => {
  const r = (max: number) => Math.floor(Math.random() * max);
  return `${r(6)}-${r(12)}-${r(8)}-${r(8)}-${r(17)}`;
};

interface AvatarProps {
  config: string; 
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ config, className = "w-20 h-20" }) => {
  const parts = (config || "0-0-0-0-0").split('-').map(Number);
  if (parts.length === 4) parts.unshift(0);

  const [typeIdx, skinIdx, eyesIdx, mouthIdx, accIdx] = parts;

  // --- COLORS ---
  const COLORS = [
    '#60A5FA', // Pastel Blue
    '#F87171', // Pastel Red
    '#34D399', // Pastel Green
    '#FBBF24', // Pastel Orange
    '#A78BFA', // Pastel Purple
    '#F472B6', // Pastel Pink
    '#22D3EE', // Cyan
    '#A3E635', // Lime
    '#9CA3AF', // Gray
    '#374151', // Dark
    '#B45309', // Brown
    '#F9FAFB', // White/Ghost
  ];

  const color = COLORS[skinIdx % COLORS.length] || COLORS[0];
  
  // Common stroke style for "Sticker" look
  const strokeStyle = { stroke: "black", strokeWidth: "3", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  // --- BODY TYPES (Refined & Cuter) ---
  const BODIES = [
    // 0: Human (Chubby Onesie Style)
    <path d="M25 88 Q15 88 15 65 Q15 10 50 10 Q85 10 85 65 Q85 88 75 88 L25 88 Z" fill={color} {...strokeStyle} />,
    
    // 1: Snake (Redesigned: Standing Cute Noodle)
    // Upright wavy body with belly scales, no longer looks like a hat/poop
    <g>
         {/* Tail tip peeking out left */}
        <path d="M25 85 Q10 85 15 75 Q20 65 30 78" fill={color} stroke="black" strokeWidth="3" strokeLinecap="round" />
        {/* Main Body */}
        <path d="M30 90 Q20 90 25 60 Q30 40 35 35 Q35 15 50 15 Q65 15 65 35 Q70 40 75 60 Q80 90 70 90 Z" fill={color} stroke="black" strokeWidth="3" />
        {/* Belly Scales (Texture) */}
        <path d="M30 75 Q50 80 70 75" fill="none" stroke="black" strokeWidth="1" opacity="0.2" />
        <path d="M28 65 Q50 70 72 65" fill="none" stroke="black" strokeWidth="1" opacity="0.2" />
        <path d="M29 55 Q50 60 71 55" fill="none" stroke="black" strokeWidth="1" opacity="0.2" />
    </g>,
    
    // 2: Alien (Teardrop Head)
    <path d="M50 90 Q25 80 25 45 Q25 5 50 5 Q75 5 75 45 Q75 80 50 90" fill={color} {...strokeStyle} />,

    // 3: Ghost (Cute rounded bottom)
    <path d="M20 90 L20 45 Q20 10 50 10 Q80 10 80 45 L80 90 L65 80 L50 90 L35 80 L20 90 Z" fill={color} {...strokeStyle} />,

    // 4: Robot (Capsule Bot)
    <g>
        <rect x="15" y="45" width="10" height="20" rx="2" fill="#9CA3AF" stroke="black" strokeWidth="3" />
        <rect x="75" y="45" width="10" height="20" rx="2" fill="#9CA3AF" stroke="black" strokeWidth="3" />
        <line x1="50" y1="20" x2="50" y2="5" stroke="black" strokeWidth="3" />
        <circle cx="50" cy="5" r="4" fill="#EF4444" stroke="black" strokeWidth="2" />
        <rect x="25" y="20" width="50" height="70" rx="25" fill={color} {...strokeStyle} />
        <rect x="35" y="60" width="30" height="20" rx="5" fill="rgba(255,255,255,0.5)" stroke="black" strokeWidth="2" />
    </g>,

    // 5: Cloud (Redesigned: Fluffier)
    // Classic 3-bump cartoon cloud
    <path d="M20 80 L80 80 Q95 80 95 65 Q95 50 80 45 Q80 20 50 20 Q20 20 20 45 Q5 50 5 65 Q5 80 20 80 Z" fill={color} {...strokeStyle} />
  ];

  const bodyType = typeIdx % BODIES.length;
  
  // --- EYES (Bigger, cuter) ---
  const EYES = [
    // 0: Classic Dots (Bigger)
    <g><circle cx="38" cy="45" r="5" fill="black"/><circle cx="62" cy="45" r="5" fill="black"/></g>,
    // 1: Shiny Anime Eyes
    <g>
        <circle cx="35" cy="45" r="7" fill="black"/> <circle cx="33" cy="43" r="2" fill="white"/>
        <circle cx="65" cy="45" r="7" fill="black"/> <circle cx="63" cy="43" r="2" fill="white"/>
    </g>,
    // 2: Happy Arcs
    <g><path d="M30 45 Q35 40 40 45" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M60 45 Q65 40 70 45" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round"/></g>,
    // 3: Angry/Determined
    <g><path d="M28 40 L42 45" stroke="black" strokeWidth="3"/><path d="M72 40 L58 45" stroke="black" strokeWidth="3"/><circle cx="35" cy="48" r="4" fill="black"/><circle cx="65" cy="48" r="4" fill="black"/></g>,
    // 4: Glasses (Nerd)
    <g><circle cx="35" cy="45" r="10" fill="white" stroke="black" strokeWidth="2"/><circle cx="65" cy="45" r="10" fill="white" stroke="black" strokeWidth="2"/><line x1="45" y1="45" x2="55" y2="45" stroke="black" strokeWidth="2"/><circle cx="35" cy="45" r="3" fill="black"/><circle cx="65" cy="45" r="3" fill="black"/></g>,
    // 5: Cyclops (Cute)
    <g><circle cx="50" cy="40" r="14" fill="white" stroke="black" strokeWidth="2"/><circle cx="50" cy="40" r="6" fill="black"/><circle cx="48" cy="38" r="2" fill="white"/></g>,
    // 6: Dead X_X
    <g><path d="M32 40 L42 50 M42 40 L32 50" stroke="black" strokeWidth="3"/><path d="M58 40 L68 50 M68 40 L58 50" stroke="black" strokeWidth="3"/></g>,
    // 7: Starry
    <g><path d="M35 40 L37 44 L41 44 L38 47 L39 51 L35 48 L31 51 L32 47 L29 44 L33 44 Z" fill="#FCD34D" stroke="black" strokeWidth="1"/><path d="M65 40 L67 44 L71 44 L68 47 L69 51 L65 48 L61 51 L62 47 L59 44 L63 44 Z" fill="#FCD34D" stroke="black" strokeWidth="1"/></g>
  ];

  // --- MOUTHS (Simpler, cuter) ---
  const MOUTHS = [
    // 0: Tiny Smile
    <path d="M45 65 Q50 68 55 65" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round"/>,
    // 1: Big Open Smile
    <path d="M35 65 Q50 85 65 65 Z" fill="#FCA5A5" stroke="black" strokeWidth="2" />,
    // 2: O Face
    <circle cx="50" cy="68" r="5" fill="black"/>,
    // 3: Flat Line
    <line x1="42" y1="68" x2="58" y2="68" stroke="black" strokeWidth="3" strokeLinecap="round"/>,
    // 4: Tongue Blep
    <g><path d="M40 65 Q50 70 60 65" stroke="black" strokeWidth="2" fill="none"/><path d="M47 68 Q50 78 53 68" fill="#EF4444" stroke="black" strokeWidth="1"/></g>,
    // 5: Sad
    <path d="M40 70 Q50 60 60 70" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round"/>,
    // 6: Cat Mouth :3
    <path d="M42 65 Q46 70 50 65 Q54 70 58 65" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    // 7: Tooth
    <g><path d="M40 65 Q50 75 60 65" stroke="black" strokeWidth="2" fill="none"/><rect x="48" y="66" width="4" height="4" fill="white" stroke="black" strokeWidth="1"/></g>
  ];

  // --- ACCESSORIES (Adjusted positions) ---
  const ACCESSORIES = [
    null,
    // 1: Cap
    <path d="M28 20 L72 20 L68 5 L32 5 Z" fill="#374151" stroke="black" strokeWidth="2"/>,
    // 2: Bandana
    <path d="M25 65 L75 65 L50 90 Z" fill="#EF4444" stroke="black" strokeWidth="2" opacity="0.9"/>,
    // 3: Crown
    <path d="M30 20 L40 5 L50 20 L60 5 L70 20 L70 25 L30 25 Z" fill="#FCD34D" stroke="black" strokeWidth="2"/>,
    // 4: Headphones
    <path d="M15 50 Q15 5 50 5 Q85 5 85 50" stroke="#1F2937" strokeWidth="5" fill="none"/>,
    // 5: Halo
    <ellipse cx="50" cy="10" rx="20" ry="4" stroke="#FCD34D" strokeWidth="3" fill="none" />,
    // 6: Devil Horns
    <g><path d="M35 20 L30 5 L45 15" fill="#EF4444" stroke="black" strokeWidth="1"/><path d="M65 20 L70 5 L55 15" fill="#EF4444" stroke="black" strokeWidth="1"/></g>,
    // 7: Bowtie
    <path d="M40 90 L35 85 L40 95 L50 90 L60 95 L65 85 L60 90 Z" fill="#F43F5E" stroke="black" strokeWidth="1"/>,
    // 8: Flower
    <g transform="translate(20, 15)"><circle cx="5" cy="5" r="5" fill="#FCD34D" stroke="black" strokeWidth="1"/><circle cx="0" cy="0" r="4" fill="white"/><circle cx="10" cy="0" r="4" fill="white"/><circle cx="10" cy="10" r="4" fill="white"/><circle cx="0" cy="10" r="4" fill="white"/></g>,
    // 9: Cowboy Hat
    <g><ellipse cx="50" cy="20" rx="40" ry="8" fill="#78350F" stroke="black" strokeWidth="2"/><path d="M35 20 L38 0 L62 0 L65 20" fill="#78350F" stroke="black" strokeWidth="2"/></g>,
    // 10: Sunglasses
    <g><path d="M25 42 Q25 52 35 52 L45 52 L45 42 L25 42 Z" fill="black" /><path d="M55 42 L55 52 65 52 Q75 52 75 42 L55 42 Z" fill="black" /><line x1="45" y1="45" x2="55" y2="45" stroke="black" strokeWidth="2" /></g>,
    // 11: Mustache
    <path d="M30 68 Q40 58 50 68 Q60 58 70 68 Q60 76 50 70 Q40 76 30 68" fill="#374151" stroke="black" strokeWidth="1"/>,
    // 12: Eyepatch
    <g><circle cx="35" cy="45" r="8" fill="black"/><path d="M35 45 L75 20" stroke="black" strokeWidth="1"/></g>,
    // 13: Bunny Ears
    <g><ellipse cx="35" cy="5" rx="5" ry="18" fill="white" stroke="black" strokeWidth="2"/><ellipse cx="35" cy="5" rx="2" ry="12" fill="#F472B6"/><ellipse cx="65" cy="5" rx="5" ry="18" fill="white" stroke="black" strokeWidth="2"/><ellipse cx="65" cy="5" rx="2" ry="12" fill="#F472B6"/></g>,
    // 14: Wizard Hat
    <g><path d="M20 25 L80 25 L50 -5 Z" fill="#7C3AED" stroke="black" strokeWidth="2"/><ellipse cx="50" cy="25" rx="35" ry="5" fill="#5B21B6" stroke="black" strokeWidth="2"/><circle cx="50" cy="10" r="2" fill="yellow"/></g>,
    // 15: Mask
    <g><rect x="25" y="60" width="50" height="25" rx="4" fill="#60A5FA" stroke="black" strokeWidth="1"/><line x1="15" y1="65" x2="25" y2="65" stroke="white" strokeWidth="2"/><line x1="75" y1="65" x2="85" y2="65" stroke="white" strokeWidth="2"/></g>,
    // 16: Santa Hat
    <g><path d="M25 20 Q50 -5 75 20" fill="#EF4444" stroke="black" strokeWidth="2"/><rect x="20" y="20" width="60" height="12" rx="4" fill="white" stroke="black" strokeWidth="2"/><circle cx="75" cy="20" r="6" fill="white" stroke="black" strokeWidth="2"/></g>
  ];

  return (
    <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md transition-transform hover:scale-105`}>
      {/* Soft Shadow */}
      <ellipse cx="50" cy="92" rx="30" ry="6" fill="rgba(0,0,0,0.15)" />
      
      {/* Body Layer */}
      {BODIES[bodyType]}
      
      {/* Specular Highlight (Cartoon shine) */}
      {/* Robot and Snake have complex shapes, so simpler highlight or none */}
      {bodyType !== 1 && bodyType !== 4 && <ellipse cx="35" cy="30" rx="8" ry="4" fill="white" opacity="0.4" transform="rotate(-45 35 30)" />}
      
      {/* Robot has its own highlight logic inside, Snake coil is complex */}

      {/* Face Features */}
      {EYES[eyesIdx % EYES.length]}
      {MOUTHS[mouthIdx % MOUTHS.length]}
      
      {/* Accessory */}
      {ACCESSORIES[accIdx % ACCESSORIES.length]}
    </svg>
  );
};
