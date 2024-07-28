precision highp float; 
precision highp int;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float dot;
uniform bool erase;
uniform uint label;
out uvec4 fragColor;

void main() {
  vec2 r = resolution.xy;
  vec2 c = gl_FragCoord.xy;
  vec2 m = mouse * r;
  vec2 o = c / r;

  vec2 grid = c - mod(c, 1.0);
  vec2 target = m - mod(m, 1.0);
  float distance = length(target - grid);

  if (distance > r.x * dot) discard;
  fragColor = erase ? uvec4(0, 0, 0, 0) : uvec4(label, 0, 0, 0);
}