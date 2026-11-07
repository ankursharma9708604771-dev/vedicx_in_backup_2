import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export function generateQuestionDiagrams(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');
  const diagramsDir = path.resolve(process.cwd(), 'public', 'diagrams');

  if (!fs.existsSync(diagramsDir)) {
    fs.mkdirSync(diagramsDir, { recursive: true });
  }

  console.log('[Diagrams] Generating CBSE Class 10 SVG diagrams in public/diagrams/...');

  // Definitions of clean vector SVGs with coordinates, geometric lines, angles, and typography
  const svgFiles: Record<string, string> = {
    // -------------------------------------------------------------------------
    // CIRCLES DIAGRAMS
    // -------------------------------------------------------------------------
    'circ-tangent-pair.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <circle cx="250" cy="120" r="70" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="250" cy="120" r="3.5" fill="#1e3a8a" />
  <text x="258" y="125" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e3a8a">O</text>
  <!-- Tangent points: A (215, 60), B (215, 180), External point P (70, 120) -->
  <line x1="70" y1="120" x2="215" y2="59" stroke="#0f172a" stroke-width="2.5" />
  <line x1="70" y1="120" x2="215" y2="181" stroke="#0f172a" stroke-width="2.5" />
  <!-- Radii OA and OB -->
  <line x1="250" y1="120" x2="215" y2="59" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" />
  <line x1="250" y1="120" x2="215" y2="181" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" />
  <!-- Line OP -->
  <line x1="70" y1="120" x2="250" y2="120" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
  <!-- Right angle symbols at A and B -->
  <rect x="208" y="65" width="8" height="8" fill="none" stroke="#ef4444" stroke-width="1.5" transform="rotate(-30 208 65)" />
  <rect x="208" y="167" width="8" height="8" fill="none" stroke="#ef4444" stroke-width="1.5" transform="rotate(30 208 167)" />
  <!-- Vertices labels -->
  <circle cx="70" cy="120" r="4" fill="#0f172a" />
  <text x="48" y="125" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">P</text>
  <circle cx="215" cy="59" r="4" fill="#0f172a" />
  <text x="215" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">A</text>
  <circle cx="215" cy="181" r="4" fill="#0f172a" />
  <text x="215" y="202" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
  <text x="135" y="78" font-family="sans-serif" font-size="12" font-semibold" fill="#475569">Tangent PA</text>
  <text x="135" y="172" font-family="sans-serif" font-size="12" font-semibold" fill="#475569">Tangent PB</text>
  <text x="245" y="90" font-family="sans-serif" font-size="11" fill="#dc2626">r</text>
  <text x="245" y="155" font-family="sans-serif" font-size="11" fill="#dc2626">r</text>
</svg>`,

    'circ-tangent-pt.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 220" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <circle cx="240" cy="110" r="65" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" />
  <circle cx="240" cy="110" r="3.5" fill="#14532d" />
  <text x="250" y="115" font-family="sans-serif" font-size="14" font-weight="bold" fill="#14532d">O</text>
  <!-- Tangent PT at T(240, 175) horizontal tangent line -->
  <line x1="60" y1="175" x2="330" y2="175" stroke="#0f172a" stroke-width="2.5" />
  <!-- Radius OT -->
  <line x1="240" y1="110" x2="240" y2="175" stroke="#ef4444" stroke-width="2.5" />
  <!-- Hypotenuse OP -->
  <line x1="240" y1="110" x2="80" y2="175" stroke="#2563eb" stroke-width="2.5" />
  <!-- Right angle at T -->
  <rect x="230" y="165" width="10" height="10" fill="none" stroke="#ef4444" stroke-width="1.5" />
  <!-- Vertices -->
  <circle cx="80" cy="175" r="4" fill="#0f172a" />
  <text x="70" y="198" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">P</text>
  <circle cx="240" cy="175" r="4" fill="#0f172a" />
  <text x="245" y="198" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">T</text>
  <!-- Dimension labels -->
  <text x="250" y="145" font-family="sans-serif" font-size="12" font-semibold" fill="#dc2626">OT = 5 cm</text>
  <text x="135" y="135" font-family="sans-serif" font-size="12" font-semibold" fill="#1d4ed8">OP = 13 cm</text>
  <text x="145" y="195" font-family="sans-serif" font-size="12" font-semibold" fill="#0f172a">PT = ?</text>
</svg>`,

    'circ-tangents-angle.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <circle cx="260" cy="120" r="70" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="260" cy="120" r="3.5" fill="#1e3a8a" />
  <text x="270" y="125" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e3a8a">O</text>
  <line x1="80" y1="120" x2="225" y2="59" stroke="#0f172a" stroke-width="2.5" />
  <line x1="80" y1="120" x2="225" y2="181" stroke="#0f172a" stroke-width="2.5" />
  <line x1="260" y1="120" x2="225" y2="59" stroke="#ef4444" stroke-width="2" />
  <line x1="260" y1="120" x2="225" y2="181" stroke="#ef4444" stroke-width="2" />
  <!-- Angle at P = 60° -->
  <path d="M 115 110 A 30 30 0 0 1 115 130" fill="none" stroke="#7c3aed" stroke-width="2" />
  <text x="125" y="125" font-family="sans-serif" font-size="13" font-weight="bold" fill="#7c3aed">60°</text>
  <!-- Angle at O -->
  <path d="M 238 100 A 25 25 0 0 0 238 140" fill="none" stroke="#dc2626" stroke-width="2" />
  <text x="215" y="125" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">?</text>
  <!-- Vertices -->
  <text x="60" y="125" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">P</text>
  <text x="225" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">A</text>
  <text x="225" y="202" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
  <text x="140" y="225" font-family="sans-serif" font-size="12" font-semibold" fill="#334155">∠APB + ∠AOB = 180°</text>
</svg>`,

    'circ-quad-circumscribed.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Inscribed circle -->
  <circle cx="190" cy="130" r="65" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
  <circle cx="190" cy="130" r="3" fill="#16a34a" />
  <text x="195" y="135" font-family="sans-serif" font-size="12" fill="#16a34a">O</text>
  <!-- Quadrilateral ABCD -->
  <polygon points="60,200 320,200 270,50 110,50" fill="none" stroke="#1e293b" stroke-width="2.5" />
  <!-- Contact points P, Q, R, S -->
  <circle cx="190" cy="200" r="3.5" fill="#dc2626" />
  <text x="187" y="218" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">P</text>
  <circle cx="285" cy="115" r="3.5" fill="#dc2626" />
  <text x="295" y="120" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">Q</text>
  <circle cx="190" cy="50" r="3.5" fill="#dc2626" />
  <text x="187" y="42" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">R</text>
  <circle cx="89" cy="115" r="3.5" fill="#dc2626" />
  <text x="70" y="120" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">S</text>
  <!-- Vertices labels -->
  <text x="45" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">A</text>
  <text x="325" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
  <text x="275" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">C</text>
  <text x="95" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">D</text>
  <!-- Side dimension labels -->
  <text x="180" y="238" font-family="sans-serif" font-size="12" font-semibold" fill="#2563eb">AB = 6 cm</text>
  <text x="300" y="150" font-family="sans-serif" font-size="12" font-semibold" fill="#2563eb">BC = 7 cm</text>
  <text x="180" y="25" font-family="sans-serif" font-size="12" font-semibold" fill="#2563eb">CD = 4 cm</text>
  <text x="35" y="150" font-family="sans-serif" font-size="12" font-semibold" fill="#dc2626">AD = ?</text>
</svg>`,

    'circ-concentric.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Outer circle R=80, Inner circle r=48 -->
  <circle cx="190" cy="120" r="85" fill="#f8fafc" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="190" cy="120" r="51" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2" />
  <circle cx="190" cy="120" r="3.5" fill="#1e3a8a" />
  <text x="195" y="115" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e3a8a">O</text>
  <!-- Horizontal chord AB of outer circle tangent to inner circle at P(190, 171) -->
  <line x1="122" y1="171" x2="258" y2="171" stroke="#dc2626" stroke-width="2.5" />
  <!-- Radii OA and OP -->
  <line x1="190" y1="120" x2="122" y2="171" stroke="#059669" stroke-width="2" />
  <line x1="190" y1="120" x2="190" y2="171" stroke="#6b7280" stroke-width="2" stroke-dasharray="3,3" />
  <rect x="182" y="163" width="8" height="8" fill="none" stroke="#6b7280" stroke-width="1.5" />
  <!-- Points -->
  <circle cx="122" cy="171" r="3.5" fill="#dc2626" />
  <text x="105" y="176" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">A</text>
  <circle cx="258" cy="171" r="3.5" fill="#dc2626" />
  <text x="265" y="176" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">B</text>
  <circle cx="190" cy="171" r="3.5" fill="#1e293b" />
  <text x="187" y="192" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e293b">P</text>
  <!-- Labels -->
  <text x="135" y="140" font-family="sans-serif" font-size="12" font-semibold" fill="#059669">5 cm</text>
  <text x="196" y="150" font-family="sans-serif" font-size="12" font-semibold" fill="#4b5563">3 cm</text>
  <text x="160" y="220" font-family="sans-serif" font-size="12" font-semibold" fill="#0f172a">Chord AB = 2 × AP = 8 cm</text>
</svg>`,

    'circ-chord-tangents.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <circle cx="140" cy="120" r="60" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="140" cy="120" r="3.5" fill="#1e3a8a" />
  <text x="145" y="115" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e3a8a">O</text>
  <!-- Chord PQ -->
  <line x1="176" y1="72" x2="176" y2="168" stroke="#16a34a" stroke-width="2" />
  <!-- Tangents TP and TQ meeting at T(290, 120) -->
  <line x1="176" y1="72" x2="290" y2="120" stroke="#0f172a" stroke-width="2.5" />
  <line x1="176" y1="168" x2="290" y2="120" stroke="#0f172a" stroke-width="2.5" />
  <!-- Center line OT -->
  <line x1="140" y1="120" x2="290" y2="120" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
  <line x1="140" y1="120" x2="176" y2="72" stroke="#dc2626" stroke-width="2" />
  <!-- Vertices -->
  <circle cx="176" cy="72" r="3.5" fill="#0f172a" />
  <text x="175" y="58" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">P</text>
  <circle cx="176" cy="168" r="3.5" fill="#0f172a" />
  <text x="175" y="190" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Q</text>
  <circle cx="290" cy="120" r="3.5" fill="#0f172a" />
  <text x="300" y="125" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">T</text>
  <text x="182" y="125" font-family="sans-serif" font-size="11" fill="#16a34a">8 cm</text>
  <text x="140" y="90" font-family="sans-serif" font-size="11" fill="#dc2626">r = 5</text>
</svg>`,

    'circ-parallel-tangents.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <circle cx="190" cy="120" r="55" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="190" cy="120" r="3" fill="#1e3a8a" />
  <text x="195" y="115" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a">O</text>
  <!-- Parallel tangents XY (top, y=65) and X'Y' (bottom, y=175) -->
  <line x1="60" y1="65" x2="320" y2="65" stroke="#0f172a" stroke-width="2" />
  <text x="40" y="70" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">X</text>
  <text x="325" y="70" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Y</text>
  <line x1="60" y1="175" x2="320" y2="175" stroke="#0f172a" stroke-width="2" />
  <text x="35" y="180" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">X'</text>
  <text x="325" y="180" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Y'</text>
  <!-- Diameter PQ -->
  <line x1="190" y1="65" x2="190" y2="175" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
  <!-- Third tangent AB touching at C -->
  <line x1="130" y1="65" x2="250" y2="175" stroke="#dc2626" stroke-width="2.5" />
  <circle cx="130" cy="65" r="3.5" fill="#dc2626" />
  <text x="120" y="55" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">A</text>
  <circle cx="250" cy="175" r="3.5" fill="#dc2626" />
  <text x="255" y="195" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">B</text>
  <!-- Angle ∠AOB = 90° -->
  <line x1="190" y1="120" x2="130" y2="65" stroke="#7c3aed" stroke-width="2" />
  <line x1="190" y1="120" x2="250" y2="175" stroke="#7c3aed" stroke-width="2" />
  <text x="175" y="145" font-family="sans-serif" font-size="13" font-weight="bold" fill="#7c3aed">90°</text>
</svg>`,

    // -------------------------------------------------------------------------
    // SURFACE AREAS AND VOLUMES DIAGRAMS
    // -------------------------------------------------------------------------
    'mens-toy-cone-hemi.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Hemisphere base at y=170, radius 60 -->
  <path d="M 100 170 A 60 60 0 0 0 220 170 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5" />
  <!-- Cone on top -->
  <path d="M 100 170 L 160 40 L 220 170 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2.5" />
  <!-- Circular common base ellipse -->
  <ellipse cx="160" cy="170" rx="60" ry="12" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3,3" />
  <!-- Height & radius dimensions -->
  <line x1="160" y1="40" x2="160" y2="170" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3" />
  <line x1="160" y1="170" x2="220" y2="170" stroke="#16a34a" stroke-width="2" />
  <!-- Dimension arrows -->
  <text x="165" y="105" font-family="sans-serif" font-size="12" font-semibold" fill="#dc2626">h = 12 cm</text>
  <text x="175" y="165" font-family="sans-serif" font-size="12" font-semibold" fill="#16a34a">r = 3.5 cm</text>
  <line x1="250" y1="40" x2="250" y2="230" stroke="#64748b" stroke-width="1.5" />
  <text x="255" y="140" font-family="sans-serif" font-size="12" font-bold" fill="#0f172a">Total H = 15.5 cm</text>
</svg>`,

    'mens-capsule.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 200" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Cylinder body from x=120 to x=260, y=60 to 140 -->
  <rect x="120" y="60" width="140" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="2" />
  <!-- Left hemisphere arc from (120,60) to (120,140) radius 40 -->
  <path d="M 120 60 A 40 40 0 0 0 120 140 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="2" />
  <!-- Right hemisphere arc from (260,60) to (260,140) radius 40 -->
  <path d="M 260 60 A 40 40 0 0 1 260 140 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="2" />
  <!-- Dividers dashed -->
  <ellipse cx="120" cy="100" rx="10" ry="40" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
  <ellipse cx="260" cy="100" rx="10" ry="40" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
  <!-- Overall length 14 mm -->
  <line x1="80" y1="170" x2="300" y2="170" stroke="#0f172a" stroke-width="1.5" />
  <text x="165" y="188" font-family="sans-serif" font-size="13" font-bold" fill="#0f172a">Total Length = 14 mm</text>
  <!-- Diameter 5 mm -->
  <line x1="50" y1="60" x2="50" y2="140" stroke="#dc2626" stroke-width="1.5" />
  <text x="15" y="105" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">d = 5 mm</text>
</svg>`,

    'mens-cubes-joined.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- First cube front face (60,80) 70x70 -->
  <rect x="60" y="80" width="70" height="70" fill="#e0e7ff" stroke="#4338ca" stroke-width="2" />
  <!-- Second cube front face (130,80) 70x70 -->
  <rect x="130" y="80" width="70" height="70" fill="#c7d2fe" stroke="#4338ca" stroke-width="2" />
  <!-- 3D top faces -->
  <polygon points="60,80 90,50 160,50 130,80" fill="#eef2ff" stroke="#4338ca" stroke-width="1.5" />
  <polygon points="130,80 160,50 230,50 200,80" fill="#eef2ff" stroke="#4338ca" stroke-width="1.5" />
  <!-- 3D right side face -->
  <polygon points="200,80 230,50 230,120 200,150" fill="#c7d2fe" stroke="#4338ca" stroke-width="1.5" />
  <!-- Dimensions -->
  <text x="110" y="175" font-family="sans-serif" font-size="12" font-bold" fill="#4338ca">l = 4 + 4 = 8 cm</text>
  <text x="15" y="120" font-family="sans-serif" font-size="12" font-semibold" fill="#475569">h = 4 cm</text>
  <text x="225" y="90" font-family="sans-serif" font-size="12" font-semibold" fill="#475569">b = 4 cm</text>
</svg>`,

    'mens-vessel-hemi-cyl.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Cylinder part from y=40 to y=140 -->
  <rect x="100" y="40" width="120" height="100" fill="#f1f5f9" stroke="#334155" stroke-width="2.5" />
  <ellipse cx="160" cy="40" rx="60" ry="12" fill="#e2e8f0" stroke="#334155" stroke-width="2" />
  <ellipse cx="160" cy="140" rx="60" ry="12" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="3,3" />
  <!-- Hemisphere bottom from y=140 to 200 -->
  <path d="M 100 140 A 60 60 0 0 0 220 140 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5" />
  <!-- Dimensions -->
  <text x="135" y="95" font-family="sans-serif" font-size="12" font-bold" fill="#0f172a">Cylinder</text>
  <text x="125" y="175" font-family="sans-serif" font-size="12" font-bold" fill="#1d4ed8">Hemisphere</text>
  <line x1="240" y1="40" x2="240" y2="200" stroke="#dc2626" stroke-width="1.5" />
  <text x="248" y="125" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">Total H = 13 cm</text>
  <text x="130" y="25" font-family="sans-serif" font-size="12" font-semibold" fill="#0f172a">d = 14 cm (r = 7 cm)</text>
</svg>`,

    'mens-bucket-frustum.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Frustum bucket -->
  <polygon points="70,50 250,50 210,180 110,180" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" />
  <ellipse cx="160" cy="50" rx="90" ry="15" fill="#dcfce7" stroke="#16a34a" stroke-width="2" />
  <ellipse cx="160" cy="180" rx="50" ry="10" fill="#bbf7d0" stroke="#16a34a" stroke-width="2" />
  <!-- Dimension lines -->
  <line x1="160" y1="50" x2="160" y2="180" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3" />
  <text x="165" y="115" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">h = 24 cm</text>
  <text x="135" y="32" font-family="sans-serif" font-size="12" font-bold" fill="#0f172a">R = 15 cm</text>
  <text x="135" y="210" font-family="sans-serif" font-size="12" font-bold" fill="#0f172a">r = 5 cm</text>
  <text x="235" y="120" font-family="sans-serif" font-size="12" font-semibold" fill="#2563eb">Slant l = 26 cm</text>
</svg>`,

    'mens-tent-cone-cyl.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Cylinder base -->
  <rect x="90" y="130" width="140" height="70" fill="#fef3c7" stroke="#d97706" stroke-width="2.5" />
  <ellipse cx="160" cy="130" rx="70" ry="12" fill="#fde68a" stroke="#d97706" stroke-width="1.5" stroke-dasharray="3,3" />
  <!-- Conical top -->
  <polygon points="90,130 160,40 230,130" fill="#fed7aa" stroke="#ea580c" stroke-width="2.5" />
  <!-- Annotations -->
  <text x="195" y="80" font-family="sans-serif" font-size="11" font-bold" fill="#ea580c">l = 2.8 m</text>
  <text x="40" y="170" font-family="sans-serif" font-size="11" font-bold" fill="#d97706">h = 2.1 m</text>
  <text x="135" y="222" font-family="sans-serif" font-size="11" font-bold" fill="#0f172a">d = 4 m (r = 2 m)</text>
</svg>`,

    'mens-well-embankment.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Outer embankment ring ellipse -->
  <ellipse cx="170" cy="70" rx="110" ry="30" fill="#fed7aa" stroke="#c2410c" stroke-width="2" />
  <!-- Inner well opening -->
  <ellipse cx="170" cy="70" rx="40" ry="12" fill="#0284c7" stroke="#0369a1" stroke-width="2" />
  <!-- Well cylinder depth -->
  <path d="M 130 70 L 130 190 A 40 12 0 0 0 210 190 L 210 70" fill="#e0f2fe" stroke="#0369a1" stroke-width="2" />
  <line x1="225" y1="70" x2="225" y2="190" stroke="#dc2626" stroke-width="1.5" />
  <text x="232" y="135" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">Depth = 14 m</text>
  <text x="135" y="220" font-family="sans-serif" font-size="12" font-bold" fill="#0369a1">Well Diameter = 3 m</text>
  <text x="100" y="35" font-family="sans-serif" font-size="12" font-bold" fill="#c2410c">Embankment Width = 4 m</text>
</svg>`,

    // -------------------------------------------------------------------------
    // TRIANGLES DIAGRAMS
    // -------------------------------------------------------------------------
    'tri-bpt-de-bc.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 250" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Triangle ABC -->
  <polygon points="170,40 60,200 280,200" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.5" />
  <!-- Parallel line DE -->
  <line x1="115" y1="120" x2="225" y2="120" stroke="#dc2626" stroke-width="2.5" />
  <!-- Points -->
  <circle cx="170" cy="40" r="4" fill="#0f172a" />
  <text x="165" y="30" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">A</text>
  <circle cx="60" cy="200" r="4" fill="#0f172a" />
  <text x="45" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
  <circle cx="280" cy="200" r="4" fill="#0f172a" />
  <text x="285" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">C</text>
  <circle cx="115" cy="120" r="4" fill="#dc2626" />
  <text x="95" y="125" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">D</text>
  <circle cx="225" cy="120" r="4" fill="#dc2626" />
  <text x="235" y="125" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">E</text>
  <!-- Parallel arrows -->
  <text x="160" y="115" font-family="sans-serif" font-size="11" fill="#dc2626">DE || BC</text>
  <text x="125" y="235" font-family="sans-serif" font-size="12" font-semibold" fill="#1e3a8a">AD / DB = AE / EC</text>
</svg>`,

    'tri-right-altitude.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 230" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Right triangle ABC with right angle at B(80, 180) -->
  <polygon points="80,50 80,180 260,180" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" />
  <rect x="80" y="170" width="10" height="10" fill="none" stroke="#16a34a" stroke-width="1.5" />
  <!-- Altitude BD perpendicular to hypotenuse AC -->
  <line x1="80" y1="180" x2="152" y2="128" stroke="#dc2626" stroke-width="2.5" />
  <!-- Points -->
  <text x="70" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">A</text>
  <text x="65" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
  <text x="265" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">C</text>
  <circle cx="152" cy="128" r="3.5" fill="#dc2626" />
  <text x="155" y="120" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">D</text>
  <text x="140" y="215" font-family="sans-serif" font-size="12" font-semibold" fill="#15803d">BD² = AD × CD</text>
</svg>`,

    // -------------------------------------------------------------------------
    // AREAS RELATED TO CIRCLES DIAGRAMS
    // -------------------------------------------------------------------------
    'areacirc-sector.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Sector 60 degrees from O(150, 180) radius 120 -->
  <path d="M 150 180 L 270 180 A 120 120 0 0 0 210 76 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="150" cy="180" r="3.5" fill="#1e3a8a" />
  <text x="135" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e3a8a">O</text>
  <!-- Central angle 60° arc -->
  <path d="M 180 180 A 30 30 0 0 0 165 154" fill="none" stroke="#7c3aed" stroke-width="2" />
  <text x="175" y="170" font-family="sans-serif" font-size="12" font-bold" fill="#7c3aed">60°</text>
  <text x="200" y="200" font-family="sans-serif" font-size="12" font-bold" fill="#2563eb">r = 6 cm</text>
  <text x="215" y="70" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">A</text>
  <text x="275" y="195" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">B</text>
  <text x="80" y="230" font-family="sans-serif" font-size="12" font-semibold" fill="#1e3a8a">Area = (θ/360) × πr²</text>
</svg>`,

    'areacirc-segment.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <circle cx="150" cy="130" r="80" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
  <!-- Minor segment shaded -->
  <path d="M 230 130 A 80 80 0 0 0 150 50 L 150 130 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
  <polygon points="150,130 150,50 230,130" fill="#f8fafc" stroke="#dc2626" stroke-width="2" />
  <!-- Right angle at O -->
  <rect x="150" y="120" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1.5" />
  <text x="135" y="145" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">O</text>
  <text x="145" y="42" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">A</text>
  <text x="238" y="135" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">B</text>
  <text x="100" y="90" font-family="sans-serif" font-size="12" font-semibold" fill="#0284c7">r = 10 cm</text>
  <text x="160" y="85" font-family="sans-serif" font-size="11" font-bold" fill="#dc2626">Minor Segment</text>
</svg>`,

    // -------------------------------------------------------------------------
    // APPLICATIONS OF TRIGONOMETRY DIAGRAMS
    // -------------------------------------------------------------------------
    'trig-tower-elevation.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 230" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Vertical Tower AB from (240, 50) to (240, 180) -->
  <line x1="240" y1="50" x2="240" y2="180" stroke="#0f172a" stroke-width="4" />
  <!-- Ground BC from (70, 180) to (240, 180) -->
  <line x1="40" y1="180" x2="280" y2="180" stroke="#475569" stroke-width="2" />
  <!-- Line of sight AC -->
  <line x1="70" y1="180" x2="240" y2="50" stroke="#dc2626" stroke-width="2.5" />
  <!-- Right angle at B -->
  <rect x="225" y="165" width="15" height="15" fill="none" stroke="#0f172a" stroke-width="1.5" />
  <!-- Angle of elevation 60° at C -->
  <path d="M 110 180 A 40 40 0 0 0 95 160" fill="none" stroke="#7c3aed" stroke-width="2" />
  <text x="115" y="172" font-family="sans-serif" font-size="12" font-bold" fill="#7c3aed">60°</text>
  <!-- Labels -->
  <text x="245" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">A (Top of tower)</text>
  <text x="245" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
  <circle cx="70" cy="180" r="4" fill="#0f172a" />
  <text x="55" y="200" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">C</text>
  <text x="135" y="200" font-family="sans-serif" font-size="12" font-bold" fill="#2563eb">15 m</text>
  <text x="250" y="115" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">h = ?</text>
</svg>`,

    'trig-tree-broken.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 230" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f8fafc" rx="8" />
  <!-- Ground line -->
  <line x1="40" y1="180" x2="300" y2="180" stroke="#475569" stroke-width="2" />
  <!-- Standing stem BC from (220,110) to (220,180) -->
  <line x1="220" y1="110" x2="220" y2="180" stroke="#16a34a" stroke-width="3.5" />
  <!-- Broken part AC bent down from (220,110) to (80,180) -->
  <line x1="220" y1="110" x2="80" y2="180" stroke="#059669" stroke-width="3" />
  <!-- Original top dashed -->
  <line x1="220" y1="40" x2="220" y2="110" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3" />
  <!-- Angle at ground = 30° -->
  <path d="M 120 180 A 40 40 0 0 0 110 165" fill="none" stroke="#dc2626" stroke-width="2" />
  <text x="125" y="172" font-family="sans-serif" font-size="12" font-bold" fill="#dc2626">30°</text>
  <!-- Labels -->
  <text x="225" y="110" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">C (Break point)</text>
  <text x="225" y="195" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">B (Foot)</text>
  <text x="65" y="195" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">A' (Top)</text>
  <text x="135" y="200" font-family="sans-serif" font-size="12" font-bold" fill="#2563eb">8 m</text>
</svg>`
  };

  // Write all SVG files to public/diagrams
  let fileCount = 0;
  for (const [filename, content] of Object.entries(svgFiles)) {
    const filePath = path.join(diagramsDir, filename);
    fs.writeFileSync(filePath, content.trim(), 'utf-8');
    fileCount++;
  }
  console.log(`[Diagrams] Successfully wrote ${fileCount} SVG diagrams to public/diagrams/.`);

  // Map diagrams to questions in database
  const questionDiagramMappings: Array<{ qId: string; diagramPath: string; prefixText?: string }> = [
    // Circles questions
    { qId: 'q-circ-m1-2', diagramPath: '/diagrams/circ-tangent-pt.svg', prefixText: 'In the given figure, a tangent PT touches a circle with centre O at T. If OT = 5 cm and OP = 13 cm, find PT.' },
    { qId: 'q-circ-m1-3', diagramPath: '/diagrams/circ-tangent-pair.svg', prefixText: 'In the given figure, a point P is 10 cm from the centre of a circle of radius 6 cm. Find the length of each tangent drawn from P.' },
    { qId: 'q-circ-m1-5', diagramPath: '/diagrams/circ-tangent-pair.svg', prefixText: 'In the given figure, two tangents PA and PB are drawn from an external point P to a circle. If PA = 7.5 cm, find PB.' },
    { qId: 'q-circ-m2-1', diagramPath: '/diagrams/circ-tangents-angle.svg', prefixText: 'In the given figure, PA and PB are tangents to the circle with centre O such that ∠APB = 60°. Find ∠AOB.' },
    { qId: 'q-circ-m2-3', diagramPath: '/diagrams/circ-quad-circumscribed.svg', prefixText: 'In the given figure, quadrilateral ABCD circumscribes a circle. If AB = 6 cm, BC = 7 cm, and CD = 4 cm, find AD.' },
    { qId: 'q-circ-m2-5', diagramPath: '/diagrams/circ-concentric.svg', prefixText: 'In the given figure, two concentric circles have radii 5 cm and 3 cm. Find the length of the chord of the larger circle which touches the smaller circle.' },
    { qId: 'q-circ-m3-2', diagramPath: '/diagrams/circ-chord-tangents.svg', prefixText: 'In the given figure, PQ is a chord of length 8 cm of a circle of radius 5 cm. The tangents at P and Q intersect at a point T. Find the length TP.' },
    { qId: 'q-circ-m3-4', diagramPath: '/diagrams/circ-parallel-tangents.svg', prefixText: 'In the given figure, XY and X\'Y\' are two parallel tangents to a circle with centre O, and tangent AB with point of contact C intercepts them. Find ∠AOB.' },

    // Surface Areas & Volumes questions
    { qId: 'q-mens-m1-1', diagramPath: '/diagrams/mens-cubes-joined.svg', prefixText: 'In the given figure, 2 cubes each of volume 64 cm³ are joined end to end. Find the total surface area of the resulting cuboid.' },
    { qId: 'q-mens-m1-2', diagramPath: '/diagrams/mens-vessel-hemi-cyl.svg', prefixText: 'In the given figure, a vessel is in the form of a hollow hemisphere mounted by a hollow cylinder. The diameter is 14 cm and total height is 13 cm. Find inner surface area.' },
    { qId: 'q-mens-m1-3', diagramPath: '/diagrams/mens-toy-cone-hemi.svg', prefixText: 'In the given figure, a solid toy is in the form of a hemisphere surmounted by a right circular cone of same radius 3.5 cm and total height 15.5 cm. Find its TSA.' },
    { qId: 'q-mens-m2-2', diagramPath: '/diagrams/mens-well-embankment.svg', prefixText: 'In the given figure, a well of diameter 3 m is dug 14 m deep. Earth taken out is spread to form a circular embankment of width 4 m. Find its height.' },
    { qId: 'q-mens-m3-1', diagramPath: '/diagrams/mens-capsule.svg', prefixText: 'In the given figure, a medicine capsule is in the shape of a cylinder with two hemispheres stuck to each end. Total length is 14 mm, diameter 5 mm. Find surface area.' },
    { qId: 'q-mens-m4-2', diagramPath: '/diagrams/mens-bucket-frustum.svg', prefixText: 'In the given figure, the radii of circular ends of a bucket of height 24 cm are 15 cm and 5 cm. Find the slant height of the bucket.' },
    { qId: 'q-mens-m4-5', diagramPath: '/diagrams/mens-tent-cone-cyl.svg', prefixText: 'In the given figure, a tent is in the shape of a cylinder surmounted by a conical top. Height and diameter of cylinder are 2.1 m and 4 m, slant height 2.8 m. Find canvas area.' },

    // Triangles questions
    { qId: 'q-tri-m1-1', diagramPath: '/diagrams/tri-bpt-de-bc.svg', prefixText: 'In the given figure, in ΔABC, DE || BC. If AD = 1.5 cm, DB = 3 cm, and AE = 1 cm, find EC.' },
    { qId: 'q-tri-m2-2', diagramPath: '/diagrams/tri-right-altitude.svg', prefixText: 'In the given figure, in right-angled ΔABC (∠B = 90°), BD ⊥ AC. If AD = 4 cm and CD = 9 cm, find BD.' },

    // Areas related to Circles
    { qId: 'q-areacirc-m1-1', diagramPath: '/diagrams/areacirc-sector.svg', prefixText: 'In the given figure, find the area of a sector of a circle with radius 6 cm if angle of the sector is 60°.' },
    { qId: 'q-areacirc-m1-4', diagramPath: '/diagrams/areacirc-segment.svg', prefixText: 'In the given figure, a chord AB of a circle of radius 10 cm subtends a right angle at the centre O. Find the area of the minor segment.' },

    // Applications of Trigonometry
    { qId: 'q-apptrig-m1-1', diagramPath: '/diagrams/trig-tower-elevation.svg', prefixText: 'In the given figure, a vertical pole casts a shadow 10√3 m long when the sun angle of elevation is 30°. Find the pole height.' },
    { qId: 'q-apptrig-m1-2', diagramPath: '/diagrams/trig-tower-elevation.svg', prefixText: 'In the given figure, from a point on the ground 20 m from the foot of a tower, its top has an angle of elevation of 45°. Find the height of the tower.' }
  ];

  const updateStmt = db.prepare(`
    UPDATE questions
    SET image_url = ?,
        question_text = COALESCE(?, question_text)
    WHERE id = ?
  `);

  let updatedCount = 0;
  for (const m of questionDiagramMappings) {
    const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(m.qId);
    if (existing) {
      updateStmt.run(m.diagramPath, m.prefixText || null, m.qId);
      updatedCount++;
    }
  }

  console.log(`[Diagrams] Successfully linked diagrams to ${updatedCount} questions in the database!`);
}

if (process.argv[1] && process.argv[1].endsWith('generateQuestionDiagrams.ts')) {
  generateQuestionDiagrams();
}
