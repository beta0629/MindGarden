/** Stacked-alpha H.264 decode — WebGL1 fragment shader (exact README math). */

export const STACKED_ALPHA_VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const STACKED_ALPHA_FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_half_texel;
varying vec2 v_uv;
void main() {
  float h = u_half_texel;
  float y = clamp(v_uv.y * 0.5, h, 0.5 - h);
  vec3 c = texture2D(u_tex, vec2(v_uv.x, y)).rgb;
  float a = texture2D(u_tex, vec2(v_uv.x, y + 0.5)).r;
  a = clamp((a - 0.006) / 0.988, 0.0, 1.0);
  vec2 e = smoothstep(0.0, 0.015, v_uv) * smoothstep(0.0, 0.015, 1.0 - v_uv);
  a *= e.x * e.y;
  gl_FragColor = vec4(min(c, vec3(a)), a);
}
`;

export type StackedAlphaGl = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  tex: WebGLTexture;
  uHalfTexel: WebGLUniformLocation;
  uTex: WebGLUniformLocation;
  lose: () => void;
};

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Create a WebGL1 context + stacked-alpha program on `canvas`.
 * Returns null when WebGL is unavailable (caller keeps the poster).
 */
export function createStackedAlphaGl(
  canvas: HTMLCanvasElement,
): StackedAlphaGl | null {
  const attrs: WebGLContextAttributes = {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  };
  const gl =
    (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ||
    (canvas.getContext(
      'experimental-webgl',
      attrs,
    ) as WebGLRenderingContext | null);
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, STACKED_ALPHA_VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, STACKED_ALPHA_FRAG);
  if (!vs || !fs) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, 'a_pos');
  gl.useProgram(program);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  if (!tex) {
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const uHalfTexel = gl.getUniformLocation(program, 'u_half_texel');
  const uTex = gl.getUniformLocation(program, 'u_tex');
  if (!uHalfTexel || !uTex) {
    gl.deleteTexture(tex);
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.uniform1i(uTex, 0);
  gl.disable(gl.BLEND);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

  return {
    gl,
    program,
    tex,
    uHalfTexel,
    uTex,
    lose: () => {
      try {
        gl.deleteTexture(tex);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Upload one video frame and draw a full-screen stacked-alpha quad. */
export function drawStackedAlphaFrame(
  api: StackedAlphaGl,
  video: HTMLVideoElement,
  cssW: number,
  cssH: number,
  dpr: number,
): void {
  const { gl, program, tex, uHalfTexel } = api;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw < 2 || vh < 2) return;

  const bw = Math.max(1, Math.round(cssW * dpr));
  const bh = Math.max(1, Math.round(cssH * dpr));
  if (gl.canvas.width !== bw || gl.canvas.height !== bh) {
    gl.canvas.width = bw;
    gl.canvas.height = bh;
  }
  gl.viewport(0, 0, bw, bh);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
  gl.uniform1f(uHalfTexel, 0.5 / vh);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
