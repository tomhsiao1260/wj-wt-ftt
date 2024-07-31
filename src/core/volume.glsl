precision highp sampler3D;
precision highp usampler3D;

varying vec2 vUv;

uniform vec2 clim;
uniform vec3 size;
uniform vec3 slice;
uniform uint align;
uniform uint label;
uniform bool colorful;
uniform bool sdfVisible;
uniform sampler2D cmdata;
uniform usampler3D maskTex;
uniform sampler3D sdfTex;
uniform sampler3D volumeTex;
uniform mat4 projectionInverse;
uniform mat4 transformInverse;

// 887 for 512^3, 1774 for 1024^3
const int MAX_STEPS = 887;
const float relative_step_size = 1.0;

float cast_mip(vec3 start_loc, vec3 step, int nsteps);
float sample_volume(vec3 uvw);
float sample_sdf(vec3 uvw);
uint sample_mask(vec3 uvw);
vec4 apply_colormap(float val);

// distance to box bounds
vec2 rayBoxDist( vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 rayDir ) {
  vec3 t0 = ( boundsMin - rayOrigin ) / rayDir;
  vec3 t1 = ( boundsMax - rayOrigin ) / rayDir;
  vec3 tmin = min( t0, t1 );
  vec3 tmax = max( t0, t1 );
  float distA = max( max( tmin.x, tmin.y ), tmin.z );
  float distB = min( tmax.x, min( tmax.y, tmax.z ) );
  float distToBox = max( 0.0, distA );
  float distInsideBox = max( 0.0, distB - distToBox );
  return vec2( distToBox, distInsideBox );
}

void main() {
  // float v = sample_volume(vec3( vUv, 0.0 ));
  // gl_FragColor = vec4(v, v, v, 1.0); return;

  // get the inverse of the sdf box transform
  mat4 transform = inverse( transformInverse );
  // convert the uv to clip space for ray transformation
  vec2 clipSpace = 2.0 * vUv - vec2( 1.0 );
  // get world ray direction
  vec3 rayOrigin = vec3( 0.0 );
  vec4 homogenousDirection = projectionInverse * vec4( clipSpace, - 1.0, 1.0 );
  vec3 rayDirection = normalize( homogenousDirection.xyz / homogenousDirection.w );
  // transform ray into local coordinates of volume bounds
  vec3 volRayOrigin = ( transformInverse * vec4( rayOrigin, 1.0 ) ).xyz;
  vec3 volRayDirection = normalize( ( transformInverse * vec4( rayDirection, 0.0 ) ).xyz );
  // find whether our ray hits the box bounds in the local box space
  vec2 boxIntersectionInfo = rayBoxDist( vec3( - 0.5 ), vec3( 0.5 ), volRayOrigin, volRayDirection );
  float distToBox = boxIntersectionInfo.x;
  float distInsideBox = boxIntersectionInfo.y;
  bool intersectsBox = distInsideBox > 0.0;
  gl_FragColor = vec4( 0.0 );

  if ( intersectsBox ) {
    int nsteps = int(boxIntersectionInfo.y * size.x / relative_step_size + 0.5);
    if ( nsteps < 1 ) discard;

    // // For testing: show the number of steps. This helps to establish whether the rays are correctly oriented
    // gl_FragColor = vec4(0.0, float(nsteps) / size.x, 1.0, 1.0);
    // return;

    vec4 boxNearPoint = vec4( volRayOrigin + volRayDirection * ( distToBox + 1e-5 ), 1.0 );
    vec4 boxFarPoint = vec4( volRayOrigin + volRayDirection * ( distToBox + distInsideBox - 1e-5 ), 1.0 );
    vec3 pn = (transform * boxNearPoint).xyz;
    vec3 pf = (transform * boxFarPoint).xyz;

    vec3 uvw = boxNearPoint.xyz + vec3( 0.5 );
    vec4 volumeColor;

    if (align == 0u) {
      // volume
      float thickness = length(pf - pn);
      nsteps = int(thickness * size.x / relative_step_size + 0.5);
      if ( nsteps < 1 ) discard;
      vec3 step = volRayDirection * thickness / float(nsteps);
      float max_val = cast_mip(uvw, step, nsteps);
      volumeColor = apply_colormap(max_val);
    } else {
      // plane Z, Y, X
      if (align == 3u) {
        uvw.z = slice.z;
      } else if (align == 2u) {
        uvw.y = slice.y;
      } else if (align == 1u) {
        uvw.x = slice.x;
      }
      float v = sample_volume(uvw);
      float s = sample_sdf(uvw);
      uint m = sample_mask(uvw);

      volumeColor = apply_colormap(v);
      if (m == label) volumeColor = mix(volumeColor, vec4(0.5, 0, 0.5, 1.0), 0.3);
      if (sdfVisible && 0.01 < s && s < 1.5) volumeColor = vec4(0, 1.0, 0.4, 1.0);
    }

    gl_FragColor = volumeColor; return;
  }

  if (gl_FragColor.a < 0.05){ discard; }
}

float sample_volume(vec3 uvw) {
  // axis transform because nrrd is in zyx axisOrder
  return texture(volumeTex, uvw.zyx).r;
}

float sample_sdf(vec3 uvw) {
  return texture(sdfTex, uvw).r;
}

uint sample_mask(vec3 uvw) {
  // axis transform because nrrd is in zyx axisOrder
  return texture(maskTex, uvw.zyx).r;
}

vec4 apply_colormap(float val) {
  float v = (val - clim[0]) / (clim[1] - clim[0]);
  if (v < 0.0 || v > 1.0) v = 0.0;

  vec4 color;
  if (colorful) {
    color = texture2D(cmdata, vec2(v, 0.5));
  } else {
    color = vec4(vec3(v), 1.0);
  }

  if (v < 0.001) color.a = 0.0;
  return color;
}

float cast_mip(vec3 start_loc, vec3 step, int nsteps) {
  float max_val = -1e6;
  int max_i = 100;
  vec3 loc = start_loc;

  for (int iter=0; iter<MAX_STEPS; iter++) {
    if (iter >= nsteps) break;
    // Sample from the 3D texture
    float v = sample_volume(loc);
    uint m = sample_mask(loc);
    float val = (m == label) ? v : 0.0;
    // Apply MIP operation
    if (val > max_val && val > clim[0] && val < clim[1]) {
      max_val = val;
      max_i = iter;
    }
    // Advance location deeper into the volume
    loc += step;
  }
  // Resolve final color
  return max_val;
}