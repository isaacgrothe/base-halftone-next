// ─── Image / Video plane shaders ───────────────────────────────────────────
// Renders the source texture onto a fullscreen quad with optional cursor-follow
// pan/zoom and a 5×5 binomial blur pass.

export const imageVertexShader = /* glsl */ `
  uniform vec2 u_scale;
  uniform vec2 u_offset;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * u_scale + u_offset, 0.0, 1.0);
  }
`

export const imageFragmentShader = /* glsl */ `
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;   // canvas size in pixels
  uniform float u_blurPx;      // blur radius in pixels
  uniform float u_aspect;      // texture aspect ratio (w/h)
  uniform float u_viewAspect;  // canvas aspect ratio (w/h)
  varying vec2 vUv;

  // 5×5 binomial blur weights (Pascal's row: 1 4 6 4 1, normalised)
  float kernel[5];

  vec3 sampleAR(vec2 uv) {
    // Aspect-ratio correction: cover mode — always fills the frame, crops if needed
    float texAR = u_aspect;
    float viewAR = u_viewAspect;
    vec2 scale = vec2(1.0);
    if (viewAR > texAR) {
      scale.y = texAR / viewAR;
    } else {
      scale.x = viewAR / texAR;
    }
    vec2 corrected = (uv - 0.5) * scale + 0.5;
    return texture2D(u_texture, corrected).rgb;
  }

  void main() {
    if (u_blurPx <= 0.0) {
      gl_FragColor = vec4(sampleAR(vUv), 1.0);
      return;
    }

    kernel[0] = 1.0 / 16.0;
    kernel[1] = 4.0 / 16.0;
    kernel[2] = 6.0 / 16.0;
    kernel[3] = 4.0 / 16.0;
    kernel[4] = 1.0 / 16.0;

    vec2 texel = u_blurPx / u_resolution;
    vec3 color = vec3(0.0);
    float weightSum = 0.0;

    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) * texel;
        float w = kernel[x + 2] * kernel[y + 2];
        color += sampleAR(vUv + offset) * w;
        weightSum += w;
      }
    }

    gl_FragColor = vec4(color / weightSum, 1.0);
  }
`

// ─── Line renderer (halftone) shaders ──────────────────────────────────────
// Post-processing pass: reads a render target texture and applies the halftone
// algorithm entirely in the fragment shader.

export const lineVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const lineFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D u_texture;
  uniform vec2 u_resolutionPixels;  // canvas size in pixels
  uniform float u_resolution;       // cells per pixel (default 0.03)
  uniform float u_scale;            // line thickness multiplier (default 0.8)
  uniform float u_contrast;         // contrast multiplier (default 4.2)
  uniform bool u_vertical;          // line orientation
  uniform bool u_invert;            // invert luminance
  uniform vec3 u_bgColor;           // background color
  uniform vec3 u_fgColor;           // foreground / line color (used when !u_useColors)
  uniform bool u_useColors;         // use per-tier line colors
  uniform vec3 u_lineColors[4];     // per-tier line colors (tiers 0..3)
  uniform bool u_blankSpots;        // skip tier -1 (very dark areas)
  uniform bool u_showGaps;          // render per-cell segments (not continuous strips)
  uniform float u_capRoundness;     // 0 = flat ends, 1 = fully round caps
  uniform bool u_alpha;             // transparent background (lines only)
  uniform bool u_showUnderlay;      // show source image underneath
  uniform int u_shapeMode;          // 0=lines, 1=dots, 2=squares, 3=diamonds

  varying vec2 vUv;

  // Deterministic per-cell hash → [0, 1)
  float cellHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  float applyContrast(float v) {
    return clamp((v - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  }

  // Returns [0..1] thickness and sets tier (-1 = blank, 0..3 = active tiers)
  float lumToThickness(float lum, out int tier) {
    if (u_blankSpots) {
      if (lum < 0.20) { tier = -1; return 0.0; }
      if (lum < 0.40) { tier = 0;  return 0.333; }
      if (lum < 0.60) { tier = 1;  return 0.555; }
      if (lum < 0.80) { tier = 2;  return 0.777; }
      tier = 3; return 1.0;
    } else {
      if (lum < 0.25) { tier = 0; return 0.25; }
      if (lum < 0.50) { tier = 1; return 0.50; }
      if (lum < 0.75) { tier = 2; return 0.75; }
      tier = 3; return 1.0;
    }
  }

  // Sample luminance for a given cell coordinate
  float cellLum(vec2 cellCoord, vec2 cellCount) {
    vec2 uv = clamp((cellCoord + 0.5) / cellCount, 0.0, 1.0);
    float l = luma(texture2D(u_texture, uv).rgb);
    l = applyContrast(l);
    if (!u_invert) l = 1.0 - l;
    return l;
  }

  // Get tier for an adjacent cell (used for continuity check)
  int adjacentTier(vec2 cellCoord, vec2 cellCount) {
    float l = cellLum(cellCoord, cellCount);
    int t;
    lumToThickness(l, t);
    return t;
  }

  void main() {
    // Number of cells across each axis
    float cx, cy;
    if (u_vertical) {
      cx = u_resolutionPixels.x * u_resolution;
      cy = cx * (u_resolutionPixels.y / u_resolutionPixels.x);
    } else {
      cy = u_resolutionPixels.y * u_resolution;
      cx = cy * (u_resolutionPixels.x / u_resolutionPixels.y);
    }
    vec2 cellCount = vec2(cx, cy);

    // Which cell are we in?
    vec2 cellCoord = floor(vUv * cellCount);
    vec2 cellPos   = fract(vUv * cellCount);  // [0,1] within the cell

    // Luminance and thickness for this cell
    float lum = cellLum(cellCoord, cellCount);
    int tier;
    float thickness = lumToThickness(lum, tier) * u_scale;

    vec3 lineColor = u_fgColor;
    if (u_useColors && tier >= 0) {
      if (tier == 0) lineColor = u_lineColors[0];
      else if (tier == 1) lineColor = u_lineColors[1];
      else if (tier == 2) lineColor = u_lineColors[2];
      else lineColor = u_lineColors[3];
    }

    // ── Shape mask ──────────────────────────────────────────────────────
    float lineMask = 0.0;
    float sdfEdge = 0.5 / max(cellCount.x, cellCount.y);

    if (u_shapeMode == 0) {
      // ── Lines ───────────────────────────────────────────────────────
      if (!u_showGaps) {
        float stripAxis = u_vertical ? cellPos.x : cellPos.y;
        float halfT = thickness * 0.5;
        float edge = 0.5 / cellCount.x;
        lineMask = 1.0 - smoothstep(halfT - edge, halfT + edge, abs(stripAxis - 0.5));
      } else {
        float stripAxis = u_vertical ? cellPos.x : cellPos.y;
        float segAxis   = u_vertical ? cellPos.y : cellPos.x;
        float halfT = thickness * 0.5;
        float pixelW = 1.0 / (u_vertical ? u_resolutionPixels.x : u_resolutionPixels.y);
        float edge = pixelW * 0.5;
        float dx = abs(stripAxis - 0.5);
        if (thickness < 0.01) {
          lineMask = 0.0;
        } else {
          vec2 adjDir = u_vertical ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
          bool connectHigh = (adjacentTier(cellCoord + adjDir, cellCount) == tier);
          bool connectLow  = (adjacentTier(cellCoord - adjDir, cellCount) == tier);
          float gapFrac = 0.05;
          float segStart = connectLow  ? 0.0 : gapFrac;
          float segEnd   = connectHigh ? 1.0 : 1.0 - gapFrac;
          float segLen   = segEnd - segStart;
          float halfSeg  = segLen * 0.5;
          float ey = segAxis - (segStart + segEnd) * 0.5;
          if (u_capRoundness < 0.01) {
            float segMask = step(segStart, segAxis) * step(segAxis, segEnd);
            float stripMask = 1.0 - smoothstep(halfT - edge, halfT + edge, dx);
            lineMask = stripMask * segMask;
          } else {
            float crLow  = connectLow  ? 0.0 : u_capRoundness * halfT;
            float crHigh = connectHigh ? 0.0 : u_capRoundness * halfT;
            float cr = (ey < 0.0) ? crLow : crHigh;
            vec2 q = vec2(dx - (halfT - cr), abs(ey) - (halfSeg - cr));
            float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cr;
            lineMask = 1.0 - smoothstep(-edge, edge, dist);
          }
        }
      }

    } else {
      vec2 p = cellPos - vec2(0.5);
      float r = thickness * 0.45;
      float dist;

      if (u_shapeMode == 1) {
        // ── Squares — box SDF ──────────────────────────────────────────
        vec2 q = abs(p) - vec2(r);
        dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);

      } else {
        // ── Mixed — hash picks one of 5 shapes per cell ────────────────
        float h = cellHash(cellCoord) * 5.0;

        if (h < 1.0) {
          // Square
          vec2 q = abs(p) - vec2(r);
          dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);

        } else if (h < 2.0) {
          // Diamond
          dist = abs(p.x) + abs(p.y) - r;

        } else if (h < 3.0) {
          // Cross / plus
          float arm = r * 0.35;
          dist = min(
            max(abs(p.x) - r, abs(p.y) - arm),
            max(abs(p.y) - r, abs(p.x) - arm)
          );

        } else if (h < 4.0) {
          // Horizontal bar
          dist = max(abs(p.x) - r, abs(p.y) - r * 0.28);

        } else {
          // Frame (hollow square)
          float outer = max(abs(p.x), abs(p.y)) - r;
          float inner = r * 0.52 - max(abs(p.x), abs(p.y));
          dist = max(outer, inner);
        }
      }

      lineMask = 1.0 - smoothstep(-sdfEdge, sdfEdge, dist);
    }

    // ── Background / underlay ────────────────────────────────────────────
    vec3 srcColor = texture2D(u_texture, vUv).rgb;
    vec3 bg = u_showUnderlay ? srcColor : u_bgColor;

    // ── Blank spots ──────────────────────────────────────────────────────
    if (tier == -1) lineMask = 0.0;

    // ── Composite ────────────────────────────────────────────────────────
    vec3 finalColor = mix(bg, lineColor, lineMask);

    if (u_alpha) {
      gl_FragColor = vec4(lineColor, lineMask);
    } else {
      gl_FragColor = vec4(finalColor, 1.0);
    }
  }
`
