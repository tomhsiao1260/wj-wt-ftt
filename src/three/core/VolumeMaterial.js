import * as THREE from "three";

export class VolumeMaterial extends THREE.ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        // The maximum distance through our rendering volume is sqrt(3).
        MAX_STEPS: 887, // 887 for 512^3, 1774 for 1024^3
        SURFACE_EPSILON: 0.001,
      },

      uniforms: {
        cmdata: { value: null },
        volumeTex: { value: dataTextureInit() },
        clim: { value: new THREE.Vector2(0.4, 1.0) },
        size: { value: new THREE.Vector3() },
        slice: { value: new THREE.Vector3() },
        direction: { value: new THREE.Vector3() },
        projectionInverse: { value: new THREE.Matrix4() },
        sdfTransformInverse: { value: new THREE.Matrix4() },
        colorful: { value: true },
        volume: { value: true },
      },

      vertexShader: /* glsl */ `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `,

      fragmentShader: /* glsl */ `
        precision highp sampler3D;

        varying vec2 vUv;
        uniform vec2 clim;
        uniform vec3 size;
        uniform vec3 slice;
        uniform vec3 direction;
        uniform bool colorful;
        uniform bool volume;
        uniform sampler3D volumeTex;
        uniform sampler2D cmdata;
        uniform mat4 projectionInverse;
        uniform mat4 sdfTransformInverse;

        const float relative_step_size = 1.0;
        const vec4 ambient_color = vec4(0.2, 0.4, 0.2, 1.0);
        const vec4 diffuse_color = vec4(0.8, 0.2, 0.2, 1.0);
        const vec4 specular_color = vec4(1.0, 1.0, 1.0, 1.0);
        const float shininess = 40.0;

        float cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);

        vec4 apply_colormap(float val);
        vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray);

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
          float fragCoordZ = -1.;

          // float v = texture(volumeTex, vec3( vUv, 0.0 )).r;
          // gl_FragColor = vec4(v, v, v, 1.0); return;

          // get the inverse of the sdf box transform
          mat4 sdfTransform = inverse( sdfTransformInverse );
          // convert the uv to clip space for ray transformation
          vec2 clipSpace = 2.0 * vUv - vec2( 1.0 );
          // get world ray direction
          vec3 rayOrigin = vec3( 0.0 );
          vec4 homogenousDirection = projectionInverse * vec4( clipSpace, - 1.0, 1.0 );
          vec3 rayDirection = normalize( homogenousDirection.xyz / homogenousDirection.w );
          // transform ray into local coordinates of sdf bounds
          vec3 sdfRayOrigin = ( sdfTransformInverse * vec4( rayOrigin, 1.0 ) ).xyz;
          vec3 sdfRayDirection = normalize( ( sdfTransformInverse * vec4( rayDirection, 0.0 ) ).xyz );
          // find whether our ray hits the box bounds in the local box space
          vec2 boxIntersectionInfo = rayBoxDist( vec3( - 0.5 ), vec3( 0.5 ), sdfRayOrigin, sdfRayDirection );
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

            vec4 boxNearPoint = vec4( sdfRayOrigin + sdfRayDirection * ( distToBox + 1e-5 ), 1.0 );
            vec4 boxFarPoint = vec4( sdfRayOrigin + sdfRayDirection * ( distToBox + distInsideBox - 1e-5 ), 1.0 );
            vec3 pn = (sdfTransform * boxNearPoint).xyz;
            vec3 pf = (sdfTransform * boxFarPoint).xyz;

            vec4 volumeColor;
            vec3 uv = (sdfTransformInverse * vec4(pn, 1.0)).xyz + vec3( 0.5 );
            bool alignX = abs(direction.x) > 0.999;
            bool alignY = abs(direction.y) > 0.999;
            bool alignZ = abs(direction.z) > 0.999;

            // volume
            if (volume && !alignX && !alignY && !alignZ) {
              float thickness = length(pf - pn);
              nsteps = int(thickness * size.x / relative_step_size + 0.5);
              if ( nsteps < 1 ) discard;
              vec3 step = sdfRayDirection * thickness / float(nsteps);
              float max_val = cast_mip(uv, step, nsteps, sdfRayDirection);
              // volumeColor = vec4(vec3(max_val), 1.0);
              volumeColor = apply_colormap(max_val);

            // plane
            } else if (alignX) {
              uv.x = slice.x;
              float v = texture(volumeTex, uv).r;
              volumeColor = apply_colormap(v);
            } else if (alignY) {
              uv.y = slice.y;
              float v = texture(volumeTex, uv).r;
              volumeColor = apply_colormap(v);
            } else if (alignZ) {
              uv.z = slice.z;
              float v = texture(volumeTex, uv).r;
              volumeColor = apply_colormap(v);
            } else {
              float v = texture(volumeTex, uv).r;
              volumeColor = apply_colormap(v);
            }

            gl_FragColor = volumeColor; return;
          }

          if (gl_FragColor.a < 0.05){ discard; }
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

        float cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {
          float max_val = -1e6;
          int max_i = 100;
          vec3 loc = start_loc;

          // float val = texture(volumeTex, start_loc).r;
          // return apply_colormap(val);

          // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
          // non-constant expression. So we use a hard-coded max, and an additional condition
          // inside the loop.
          for (int iter=0; iter<MAX_STEPS; iter++) {
            if (iter >= nsteps) break;
            // Sample from the 3D texture
            float val = texture(volumeTex, loc).r;
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
      `,
    });
  }
}

function dataTextureInit() {
  const texture = new THREE.Data3DTexture(new Uint8Array([0]), 1, 1, 1);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  return texture;
}
