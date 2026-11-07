import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), 'public', 'diagrams');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Ogives Intersecting at Median
const statOgiveMedian = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="100%" height="100%">
  <defs>
    <style>
      .axis { stroke: #1e293b; stroke-width: 2.5; stroke-linecap: round; }
      .grid { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 3 3; }
      .label { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; fill: #475569; font-weight: 500; }
      .axis-title { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; fill: #0f172a; font-weight: 700; }
      .curve-less { stroke: #2563eb; stroke-width: 3; fill: none; stroke-linecap: round; }
      .curve-more { stroke: #dc2626; stroke-width: 3; fill: none; stroke-linecap: round; }
      .ref-line { stroke: #7c3aed; stroke-width: 2; stroke-dasharray: 4 4; }
      .pt { fill: #ffffff; stroke-width: 2.5; }
      .badge-text { font-family: system-ui, sans-serif; font-size: 11px; font-weight: 700; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="520" height="340" fill="#ffffff" rx="12" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Title Badge -->
  <rect x="20" y="16" width="310" height="26" rx="6" fill="#f1f5f9"/>
  <text x="30" y="34" class="axis-title" fill="#1e293b">STATISTICS: MEDIAN FROM INTERSECTION OF OGIVES</text>

  <!-- Grid lines -->
  <line x1="70" y1="280" x2="480" y2="280" class="axis"/>
  <line x1="70" y1="60" x2="70" y2="280" class="axis"/>

  <!-- Horizontal gridlines -->
  <line x1="70" y1="230" x2="480" y2="230" class="grid"/>
  <text x="45" y="234" class="label">20</text>
  <line x1="70" y1="180" x2="480" y2="180" class="grid"/>
  <text x="45" y="184" class="label">40</text>
  <line x1="70" y1="130" x2="480" y2="130" class="grid"/>
  <text x="40" y="134" class="label" font-weight="700" fill="#7c3aed">50 (N/2)</text>
  <line x1="70" y1="80" x2="480" y2="80" class="grid"/>
  <text x="45" y="84" class="label">80</text>

  <!-- Vertical gridlines & x-ticks -->
  <line x1="140" y1="60" x2="140" y2="280" class="grid"/>
  <text x="135" y="296" class="label">10</text>
  <line x1="210" y1="60" x2="210" y2="280" class="grid"/>
  <text x="205" y="296" class="label">20</text>
  <line x1="280" y1="60" x2="280" y2="280" class="grid"/>
  <text x="275" y="296" class="label" font-weight="700" fill="#7c3aed">30 (Median)</text>
  <line x1="350" y1="60" x2="350" y2="280" class="grid"/>
  <text x="345" y="296" class="label">40</text>
  <line x1="420" y1="60" x2="420" y2="280" class="grid"/>
  <text x="415" y="296" class="label">50</text>

  <!-- Less than Ogive (Ascending) -->
  <path d="M 70 270 C 120 260, 160 220, 210 190 C 240 170, 260 145, 280 130 C 310 110, 360 85, 420 75" class="curve-less"/>
  <!-- More than Ogive (Descending) -->
  <path d="M 70 75 C 130 85, 180 110, 210 130 C 240 145, 260 170, 280 130 C 310 185, 360 220, 420 270" class="curve-more"/>

  <!-- Intersection Drop Perpendiculars -->
  <line x1="70" y1="130" x2="280" y2="130" class="ref-line"/>
  <line x1="280" y1="130" x2="280" y2="280" class="ref-line"/>

  <!-- Point of intersection -->
  <circle cx="280" cy="130" r="6" fill="#7c3aed" stroke="#ffffff" stroke-width="2"/>
  <rect x="290" y="112" width="125" height="24" rx="5" fill="#7c3aed"/>
  <text x="296" y="128" fill="#ffffff" class="badge-text">Point P (Median, N/2)</text>

  <!-- Axis Titles -->
  <text x="275" y="325" text-anchor="middle" class="axis-title">Upper / Lower Class Limits (Marks)</text>
  <text x="-170" y="24" transform="rotate(-90)" text-anchor="middle" class="axis-title">Cumulative Frequency (cf)</text>

  <!-- Legend -->
  <rect x="360" y="16" width="145" height="48" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
  <line x1="370" y1="30" x2="395" y2="30" class="curve-less"/>
  <circle cx="382" cy="30" r="3" fill="#2563eb"/>
  <text x="402" y="34" class="label" font-weight="600">Less-than ogive</text>
  <line x1="370" y1="48" x2="395" y2="48" class="curve-more"/>
  <circle cx="382" cy="48" r="3" fill="#dc2626"/>
  <text x="402" y="52" class="label" font-weight="600">More-than ogive</text>
</svg>`;

// 2. Histogram with Modal Class & Mode Determination
const statHistogramMode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="100%" height="100%">
  <defs>
    <style>
      .axis { stroke: #1e293b; stroke-width: 2.5; stroke-linecap: round; }
      .bar { stroke: #1e293b; stroke-width: 1.5; }
      .modal-bar { fill: #dbeafe; stroke: #2563eb; stroke-width: 2.5; }
      .adj-bar { fill: #f1f5f9; }
      .label { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; fill: #475569; font-weight: 500; }
      .axis-title { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; fill: #0f172a; font-weight: 700; }
      .diag { stroke: #dc2626; stroke-width: 2; stroke-dasharray: 4 3; }
      .drop-line { stroke: #2563eb; stroke-width: 2.5; stroke-dasharray: 4 4; }
      .badge-text { font-family: system-ui, sans-serif; font-size: 11px; font-weight: 700; }
    </style>
  </defs>

  <rect width="520" height="340" fill="#ffffff" rx="12" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Title Badge -->
  <rect x="20" y="16" width="310" height="26" rx="6" fill="#f1f5f9"/>
  <text x="30" y="34" class="axis-title" fill="#1e293b">STATISTICS: GRAPHICAL ESTIMATION OF MODE</text>

  <!-- Axes -->
  <line x1="60" y1="270" x2="470" y2="270" class="axis"/>
  <line x1="60" y1="60" x2="60" y2="270" class="axis"/>

  <!-- Bars: (Classes: 0-10, 10-20, 20-30[Modal], 30-40, 40-50) -->
  <!-- Bar 0-10 (f=5, h=50px) -->
  <rect x="70" y="220" width="70" height="50" class="bar adj-bar"/>
  <text x="105" y="210" class="label" text-anchor="middle">f = 5</text>

  <!-- Bar 10-20 (f=10, h=100px, y=170) -->
  <rect x="140" y="170" width="70" height="100" class="bar adj-bar"/>
  <text x="175" y="160" class="label" text-anchor="middle">f₀ = 10</text>

  <!-- Modal Bar 20-30 (f₁=18, h=180px, y=90) -->
  <rect x="210" y="90" width="80" height="180" class="bar modal-bar"/>
  <text x="250" y="80" class="label" font-weight="700" fill="#2563eb" text-anchor="middle">f₁ = 18 (Modal)</text>

  <!-- Bar 30-40 (f₂=8, h=80px, y=190) -->
  <rect x="290" y="190" width="70" height="80" class="bar adj-bar"/>
  <text x="325" y="180" class="label" text-anchor="middle">f₂ = 8</text>

  <!-- Bar 40-50 (f=4, h=40px, y=230) -->
  <rect x="360" y="230" width="70" height="40" class="bar adj-bar"/>
  <text x="395" y="220" class="label" text-anchor="middle">f = 4</text>

  <!-- Diagonals inside Modal Bar:
       From (210, 90) to (290, 190)
       From (290, 90) to (210, 170)
  -->
  <line x1="210" y1="90" x2="290" y2="190" class="diag"/>
  <line x1="290" y1="90" x2="210" y2="170" class="diag"/>

  <!-- Intersection of diagonals approx at x=245, y=134 -->
  <circle cx="245" cy="134" r="5" fill="#dc2626"/>
  <line x1="245" y1="134" x2="245" y2="270" class="drop-line"/>

  <!-- Mode Marker on X-axis -->
  <polygon points="245,264 240,254 250,254" fill="#2563eb"/>
  <rect x="215" y="284" width="60" height="22" rx="4" fill="#2563eb"/>
  <text x="245" y="299" fill="#ffffff" class="badge-text" text-anchor="middle">Mode</text>

  <!-- X axis ticks -->
  <text x="70" y="283" class="label">0</text>
  <text x="140" y="283" class="label">10</text>
  <text x="205" y="283" class="label" font-weight="700">20</text>
  <text x="290" y="283" class="label" font-weight="700">30</text>
  <text x="360" y="283" class="label">40</text>
  <text x="430" y="283" class="label">50</text>

  <!-- Y axis title -->
  <text x="-165" y="20" transform="rotate(-90)" text-anchor="middle" class="axis-title">Frequency (f)</text>
  <text x="260" y="325" text-anchor="middle" class="axis-title">Class Intervals</text>

  <!-- Legend Box -->
  <rect x="365" y="16" width="140" height="48" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
  <line x1="375" y1="32" x2="400" y2="32" class="diag"/>
  <text x="408" y="36" class="label">Diagonal intersection</text>
  <line x1="375" y1="48" x2="400" y2="48" class="drop-line"/>
  <text x="408" y="52" class="label">Perpendicular to Mode</text>
</svg>`;

// 3. Frequency Polygon
const statFrequencyPolygon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="100%" height="100%">
  <defs>
    <style>
      .axis { stroke: #1e293b; stroke-width: 2.5; stroke-linecap: round; }
      .grid { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 3 3; }
      .bar-outline { stroke: #cbd5e1; stroke-width: 1; stroke-dasharray: 2 2; fill: #f8fafc; }
      .polygon-line { stroke: #0284c7; stroke-width: 3; fill: rgba(2, 132, 199, 0.08); stroke-linecap: round; }
      .label { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; fill: #475569; font-weight: 500; }
      .axis-title { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; fill: #0f172a; font-weight: 700; }
      .mid-pt { fill: #0284c7; stroke: #ffffff; stroke-width: 2; }
    </style>
  </defs>

  <rect width="520" height="340" fill="#ffffff" rx="12" stroke="#e2e8f0" stroke-width="1"/>

  <rect x="20" y="16" width="310" height="26" rx="6" fill="#f1f5f9"/>
  <text x="30" y="34" class="axis-title" fill="#1e293b">STATISTICS: FREQUENCY POLYGON (NCERT)</text>

  <!-- Axes -->
  <line x1="60" y1="270" x2="480" y2="270" class="axis"/>
  <line x1="60" y1="60" x2="60" y2="270" class="axis"/>

  <!-- Class outlines (0-10, 10-20, 20-30, 30-40, 40-50, 50-60) -->
  <rect x="70" y="210" width="60" height="60" class="bar-outline"/>
  <rect x="130" y="160" width="60" height="110" class="bar-outline"/>
  <rect x="190" y="90" width="60" height="180" class="bar-outline"/>
  <rect x="250" y="130" width="60" height="140" class="bar-outline"/>
  <rect x="310" y="190" width="60" height="80" class="bar-outline"/>
  <rect x="370" y="240" width="60" height="30" class="bar-outline"/>

  <!-- Frequency Polygon Path with closure to baseline midpoints:
       Midpoints:
       Pre: (40, 270)
       1: (100, 210)
       2: (160, 160)
       3: (220, 90)
       4: (280, 130)
       5: (340, 190)
       6: (400, 240)
       Post: (460, 270)
  -->
  <path d="M 40 270 L 100 210 L 160 160 L 220 90 L 280 130 L 340 190 L 400 240 L 460 270 Z" class="polygon-line"/>

  <!-- Midpoint dots -->
  <circle cx="100" cy="210" r="5" class="mid-pt"/>
  <circle cx="160" cy="160" r="5" class="mid-pt"/>
  <circle cx="220" cy="90" r="5" class="mid-pt"/>
  <circle cx="280" cy="130" r="5" class="mid-pt"/>
  <circle cx="340" cy="190" r="5" class="mid-pt"/>
  <circle cx="400" cy="240" r="5" class="mid-pt"/>

  <!-- Midpoint Labels -->
  <text x="100" y="295" class="label" text-anchor="middle">5</text>
  <text x="160" y="295" class="label" text-anchor="middle">15</text>
  <text x="220" y="295" class="label" text-anchor="middle" font-weight="700">25</text>
  <text x="280" y="295" class="label" text-anchor="middle">35</text>
  <text x="340" y="295" class="label" text-anchor="middle">45</text>
  <text x="400" y="295" class="label" text-anchor="middle">55</text>

  <text x="260" y="325" text-anchor="middle" class="axis-title">Class Marks (Mid-points)</text>
  <text x="-165" y="20" transform="rotate(-90)" text-anchor="middle" class="axis-title">Frequency (f)</text>
</svg>`;

// Write files to public/diagrams
fs.writeFileSync(path.join(outDir, 'stat-ogive-median.svg'), statOgiveMedian);
fs.writeFileSync(path.join(outDir, 'stat-histogram-mode.svg'), statHistogramMode);
fs.writeFileSync(path.join(outDir, 'stat-frequency-polygon.svg'), statFrequencyPolygon);

console.log('Statistics diagrams written successfully to public/diagrams!');

// Also write to dist/diagrams if dist exists
const distDir = path.resolve(process.cwd(), 'dist', 'diagrams');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'stat-ogive-median.svg'), statOgiveMedian);
  fs.writeFileSync(path.join(distDir, 'stat-histogram-mode.svg'), statHistogramMode);
  fs.writeFileSync(path.join(distDir, 'stat-frequency-polygon.svg'), statFrequencyPolygon);
  console.log('Statistics diagrams written to dist/diagrams as well!');
}
