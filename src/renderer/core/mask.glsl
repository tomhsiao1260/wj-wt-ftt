precision highp float;
precision highp int;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float dot;
uniform float depth;
uniform bool erase;
uniform uint label;
uniform uint align;
out uvec4 fragColor;

void main() {
  vec2 r = resolution.xy;
  vec2 c = gl_FragCoord.xy;
  vec2 m = mouse * r;
  vec2 o = c / r;

  vec2 grid = c - mod(c, 1.0);
  vec2 target = m - mod(m, 1.0);

  float d = length(target - grid);
  float dx = length(target.x - grid.x);
  float dy = length(target.y - grid.y);

  // z axis (circle)
  if (align == 3u && d > r.x * dot) discard;
  // y axis (rectangle)
  if (align == 2u && (dx > r.x * dot || dy > r.y * depth)) discard;
  // x axis (rectangle)
  if (align == 1u && (dy > r.y * dot || dx > r.x * depth)) discard;

  fragColor = erase ? uvec4(0, 0, 0, 0) : uvec4(label, 0, 0, 0);
}
