const STORAGE_KEY = "cyberzen:v1";

// If you want to use a ShaderToy shader (e.g. Heartfelt `ltffzl`),
// paste the Image shader code (the body containing `mainImage`) here.
// Note: ShaderToy pages are often protected (403) from automated fetching.
const SHADERTOY_RAIN_IMAGE_CODE = `
// Heartfelt - by Martijn Steinrucken aka BigWings - 2017
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// I revisited the rain effect I did for another shader. This one is better in multiple ways:
// 1. The glass gets foggy.
// 2. Drops cut trails in the fog on the glass.
// 3. The amount of rain is adjustable (with Mouse.y)

// To have full control over the rain, uncomment the HAS_HEART define

// A video of the effect can be found here:
// https://www.youtube.com/watch?v=uiF5Tlw22PI&feature=youtu.be

// Music - Alone In The Dark - Vadim Kiselev
// https://soundcloud.com/ahmed-gado-1/sad-piano-alone-in-the-dark
// Rain sounds:
// https://soundcloud.com/elirtmusic/sleeping-sound-rain-and-thunder-1-hours

#define S(a, b, t) smoothstep(a, b, t)
//#define CHEAP_NORMALS
//#define HAS_HEART
#define USE_POST_PROCESSING

vec3 N13(float p) {
    //  from DAVE HOSKINS
   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
   p3 += dot(p3, p3.yzx + 19.19);
   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

vec4 N14(float t) {
	return fract(sin(t*vec4(123., 1024., 1456., 264.))*vec4(6547., 345., 8799., 1564.));
}
float N(float t) {
    return fract(sin(t*12345.564)*7658.76);
}

float Saw(float b, float t) {
	return S(0., b, t)*S(1., b, t);
}


vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;

    uv.y += t*0.75;
    vec2 a = vec2(6., 1.);
    vec2 grid = a*2.;
    vec2 id = floor(uv*grid);

    float colShift = N(id.x);
    uv.y += colShift;

    id = floor(uv*grid);
    vec3 n = N13(id.x*35.2+id.y*2376.1);
    vec2 st = fract(uv*grid)-vec2(.5, 0);

    float x = n.x-.5;

    float y = UV.y*20.;
    float wiggle = sin(y+sin(y));
    x += wiggle*(.5-abs(x))*(n.z-.5);
    x *= .7;
    float ti = fract(t+n.z);
    y = (Saw(.85, ti)-.5)*.9+.5;
    vec2 p = vec2(x, y);

    float d = length((st-p)*a.yx);

    float mainDrop = S(.4, .0, d);

    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x-x);
    float trail = S(.23*r, .15*r*r, cd);
    float trailFront = S(-.02, .02, st.y-y);
    trail *= trailFront*r*r;

    y = UV.y;
    float trail2 = S(.2*r, .0, cd);
    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
    y = fract(y*10.)+(st.y-.5);
    float dd = length(st-vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop+droplets*r*trailFront;

    //m += st.x>a.y*.45 || st.y>a.x*.165 ? 1.2 : 0.;
    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
	uv *= 40.;

    vec2 id = floor(uv);
    uv = fract(uv)-.5;
    vec3 n = N13(id.x*107.45+id.y*3543.654);
    vec2 p = (n.xy-.5)*.7;
    float d = length(uv-p);

    float fade = Saw(.025, fract(t+n.z));
    float c = S(.3, 0., d)*fract(n.z*10.)*fade;
    return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
    float s = StaticDrops(uv, t)*l0;
    vec2 m1 = DropLayer2(uv, t)*l1;
    vec2 m2 = DropLayer2(uv*1.85, t)*l2;

    float c = s+m1.x+m2.x;
    c = S(.3, 1., c);

    return vec2(c, max(m1.y*l0, m2.y*l1));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy-.5*iResolution.xy) / iResolution.y;
    vec2 UV = fragCoord.xy/iResolution.xy;
    vec3 M = iMouse.xyz/iResolution.xyz;
    float T = iTime+M.x*2.;

    #ifdef HAS_HEART
    T = mod(iTime, 102.);
    T = mix(T, M.x*102., M.z>0.?1.:0.);
    #endif


    float t = T*.2;

    float rainAmount = iMouse.z>0. ? M.y : sin(T*.05)*.3+.7;

    float maxBlur = mix(3., 6., rainAmount);
    float minBlur = 2.;

    float story = 0.;
    float heart = 0.;

    #ifdef HAS_HEART
    story = S(0., 70., T);

    t = min(1., T/70.);						// remap drop time so it goes slower when it freezes
    t = 1.-t;
    t = (1.-t*t)*70.;

    float zoom= mix(.3, 1.2, story);		// slowly zoom out
    uv *=zoom;
    minBlur = 4.+S(.5, 1., story)*3.;		// more opaque glass towards the end
    maxBlur = 6.+S(.5, 1., story)*1.5;

    vec2 hv = uv-vec2(.0, -.1);				// build heart
    hv.x *= .5;
    float s = S(110., 70., T);				// heart gets smaller and fades towards the end
    hv.y-=sqrt(abs(hv.x))*.5*s;
    heart = length(hv);
    heart = S(.4*s, .2*s, heart)*s;
    rainAmount = heart;						// the rain is where the heart is

    maxBlur-=heart;							// inside the heart slighly less foggy
    uv *= 1.5;								// zoom out a bit more
    t *= .25;
    #else
    float zoom = -cos(T*.2);
    uv *= .7+zoom*.3;
    #endif
    UV = (UV-.5)*(.9+zoom*.1)+.5;

    float staticDrops = S(-.5, 1., rainAmount)*2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);


    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
   #ifdef CHEAP_NORMALS
    	vec2 n = vec2(dFdx(c.x), dFdy(c.x));// cheap normals (3x cheaper, but 2 times shittier ;))
    #else
    	vec2 e = vec2(.001, 0.);
    	float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
    	float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
    	vec2 n = vec2(cx-c.x, cy-c.x);		// expensive normals
    #endif


    #ifdef HAS_HEART
    n *= 1.-S(60., 85., T);
    c.y *= 1.-S(80., 100., T)*.8;
    #endif

    float focus = mix(maxBlur-c.y, minBlur, S(.1, .2, c.x));
    vec3 col = textureLod(iChannel0, UV+n, focus).rgb;


    #ifdef USE_POST_PROCESSING
    t = (T+3.)*.5;										// make time sync with first lightnoing
    float colFade = sin(t*.2)*.5+.5+story;
    col *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade);	// subtle color shift
    float fade = S(0., 10., T);							// fade in at the start
    float lightning = sin(t*sin(t*10.));				// lighting flicker
    lightning *= pow(max(0., sin(t+sin(t))), 10.);		// lightning flash
    col *= 1.+lightning*fade*mix(1., .1, story*story);	// composite lightning
    col *= 1.-dot(UV-=.5, UV);							// vignette

    #ifdef HAS_HEART
    	col = mix(pow(col, vec3(1.2)), col, heart);
    	fade *= S(102., 97., T);
    #endif

    col *= fade;										// composite start and end fade
    #endif

    //col = vec3(heart);
    fragColor = vec4(col, 1.);
}
`;
const SHADERTOY_SNOW_IMAGE_CODE = `
// Copyright (c) 2013 Andrew Baldwin (twitter: baldand, www: http://thndl.com)
// License = Attribution-NonCommercial-ShareAlike (http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US)
//
// "Just snow"
// Simple (but not cheap) snow made from multiple parallax layers with randomly positioned
// flakes and directions. Also includes a DoF effect. Pan around with mouse.
//
// Adaptation for this app:
// - uses iIntensity (0..1) to blend Light Snow -> Blizzard at runtime.

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	const mat3 p = mat3(13.323122,23.5112,21.71123,
                        21.1212,  28.7312,11.9312,
                        21.8112,  14.7212,61.3934);

    float k = clamp(iIntensity, 0.0, 1.0);     // 0 light, 1 blizzard
    int layers = int(mix(50.0, 200.0, k) + 0.5);
    float DEPTH = mix(0.5, 0.1, k);
    float WIDTH = mix(0.3, 0.8, k);
    float SPEED = mix(0.6, 1.5, k);

	vec2 uv = iMouse.xy/iResolution.xy + vec2(1.,iResolution.y/iResolution.x)*fragCoord.xy / iResolution.xy;
	vec3 acc = vec3(0.0);
	float dof = 5.*sin(iTime*.1);

	for (int i=0;i<200;i++) {
        if (i >= layers) break;
		float fi = float(i);
		vec2 q = uv*(1.+fi*DEPTH);
		q += vec2(q.y*(WIDTH*mod(fi*7.238917,1.)-WIDTH*.5),SPEED*iTime/(1.+fi*DEPTH*.03));
		vec3 n = vec3(floor(q),31.189+fi);
		vec3 m = floor(n)*.00001 + fract(n);
		vec3 mp = (31415.9+m)/fract(p*m);
		vec3 r = fract(mp);
		vec2 s = abs(mod(q,1.)-.5+.9*r.xy-.45);
		s += .01*abs(2.*fract(10.*q.yx)-1.);
		float d = .6*max(s.x-s.y,s.x+s.y)+max(s.x,s.y)-.01;
		float edge = .005+.05*min(.5*abs(fi-5.-dof),1.);
		acc += vec3(smoothstep(edge,-edge,d)*(r.x/(1.+.02*fi*DEPTH)));
	}
	fragColor = vec4(vec3(acc),1.0);
}
`;

/** @type {{mode:"rain"|"snow", font:"zen-sans"|"zen-serif"|"zen-mono", text:string, mixer:{intensity:number, blur:number, noise:number, music:number}, timer:{presetSec:number}}} */
let state = {
  mode: "rain",
  font: "zen-sans",
  text: "",
  mixer: { intensity: 0.72, blur: 14, noise: 0.10, music: 0.35 },
  timer: { presetSec: 25 * 60 },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    state = {
      ...state,
      ...parsed,
      mixer: { ...state.mixer, ...(parsed.mixer || {}) },
      timer: { ...state.timer, ...(parsed.timer || {}) },
    };
  } catch {}
}

let saveT = 0;
function saveStateSoon() {
  window.clearTimeout(saveT);
  saveT = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, 80);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function $(sel) {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
}

function fmtMMSS(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------- Top hover reveal ----------
const topZone = $("#topZone");
topZone.addEventListener("mouseenter", () => document.body.setAttribute("data-top-hover", "true"));
topZone.addEventListener("mouseleave", () => document.body.removeAttribute("data-top-hover"));

// ---------- Mode switch ----------
const modeSwitch = $("#modeSwitch");
// Keep switch visible while hovering the button itself (otherwise leaving topZone hides it).
modeSwitch.addEventListener("mouseenter", () => document.body.setAttribute("data-top-hover", "true"));
modeSwitch.addEventListener("mouseleave", () => document.body.removeAttribute("data-top-hover"));
modeSwitch.addEventListener("click", () => {
  state.mode = state.mode === "rain" ? "snow" : "rain";
  applyModeUI();
  gl.setMode(state.mode);
  saveStateSoon();
});

function applyModeUI() {
  for (const el of modeSwitch.querySelectorAll(".modeLabel")) {
    const m = el.getAttribute("data-mode");
    el.classList.toggle("active", m === state.mode);
  }
}

// ---------- Fonts ----------
document.body.setAttribute("data-font", state.font);
const segBtns = Array.from(document.querySelectorAll(".segBtn"));
segBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const font = btn.getAttribute("data-font");
    if (font !== "zen-sans" && font !== "zen-serif" && font !== "zen-mono") return;
    state.font = font;
    document.body.setAttribute("data-font", font);
    segBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    saveStateSoon();
  });
});
function applyFontUI() {
  document.body.setAttribute("data-font", state.font);
  segBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-font") === state.font)));
}

// ---------- Editor (Deck) ----------
const editor = /** @type {HTMLTextAreaElement} */ ($("#editor"));
editor.value = state.text || "";
editor.addEventListener("input", () => {
  state.text = editor.value;
  saveStateSoon();
});

// Keep Deck state across modes by design: nothing to do.

// Export .txt
$("#exportTxt").addEventListener("click", () => {
  const blob = new Blob([editor.value || ""], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = URL.createObjectURL(blob);
  a.download = `cyber-zen-${ts}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2500);
});

// ---------- Vibe Mixer ----------
const mixer = $("#mixer");
const sIntensity = /** @type {HTMLInputElement} */ ($("#sIntensity"));
const sBlur = /** @type {HTMLInputElement} */ ($("#sBlur"));
const sNoise = /** @type {HTMLInputElement} */ ($("#sNoise"));
const sMusic = /** @type {HTMLInputElement} */ ($("#sMusic"));
const audioToggle = $("#audioToggle");

function applyMixerUI() {
  sIntensity.value = String(state.mixer.intensity);
  sBlur.value = String(state.mixer.blur);
  sNoise.value = String(state.mixer.noise);
  sMusic.value = String(state.mixer.music);
  document.documentElement.style.setProperty("--blur", `${state.mixer.blur}px`);
  gl.setIntensity(state.mixer.intensity);
}

sIntensity.addEventListener("input", () => {
  state.mixer.intensity = clamp01(parseFloat(sIntensity.value || "0"));
  gl.setIntensity(state.mixer.intensity);
  saveStateSoon();
});
sBlur.addEventListener("input", () => {
  state.mixer.blur = Math.max(0, parseFloat(sBlur.value || "0"));
  document.documentElement.style.setProperty("--blur", `${state.mixer.blur}px`);
  saveStateSoon();
});

// ---------- Audio (white noise + simple ambient synth) ----------
class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.master = null;
    this.noiseGain = null;
    this.musicGain = null;
    this.mixA = null;
    this.mixB = null;
    this._noiseSrc = null;
    this._started = false;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.65;
    this.master.connect(this.ctx.destination);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.18;
    this.musicGain.connect(this.master);

    // Two gentle layers to crossfade (A: warm pad-ish, B: airy bell-ish)
    this.mixA = this.ctx.createGain();
    this.mixB = this.ctx.createGain();
    this.mixA.connect(this.musicGain);
    this.mixB.connect(this.musicGain);
    this.mixA.gain.value = 1;
    this.mixB.gain.value = 0;
  }

  startIfNeeded() {
    this.ensure();
    if (!this.ctx || this._started) return;

    // White noise
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    noise.connect(this.noiseGain);
    noise.start();
    this._noiseSrc = noise;

    // Music A: detuned triangle drones
    const a1 = this.ctx.createOscillator();
    const a2 = this.ctx.createOscillator();
    a1.type = "triangle";
    a2.type = "triangle";
    a1.frequency.value = 110;
    a2.frequency.value = 110.7;
    const aFilter = this.ctx.createBiquadFilter();
    aFilter.type = "lowpass";
    aFilter.frequency.value = 320;
    const aGain = this.ctx.createGain();
    aGain.gain.value = 0.09;
    a1.connect(aFilter);
    a2.connect(aFilter);
    aFilter.connect(aGain);
    aGain.connect(this.mixA);
    a1.start();
    a2.start();

    // Music B: soft sine "bells"
    const b1 = this.ctx.createOscillator();
    b1.type = "sine";
    b1.frequency.value = 440;
    const bGain = this.ctx.createGain();
    bGain.gain.value = 0.0;
    b1.connect(bGain);
    bGain.connect(this.mixB);
    b1.start();
    // periodic bell taps
    const tick = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const v = 0.10 + 0.08 * Math.random();
      bGain.gain.cancelScheduledValues(now);
      bGain.gain.setValueAtTime(0.0, now);
      bGain.gain.linearRampToValueAtTime(v, now + 0.02);
      bGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + Math.random() * 0.9);
      b1.frequency.setValueAtTime(360 + Math.random() * 280, now);
    };
    tick();
    setInterval(tick, 1700);

    this._started = true;
  }

  async setEnabled(on) {
    this.ensure();
    if (!this.ctx) return;
    if (on) {
      await this.ctx.resume();
      this.startIfNeeded();
    } else {
      // keep graph alive; just mute master
      this.master.gain.value = 0;
    }
  }

  setMaster(on) {
    if (!this.master) return;
    this.master.gain.value = on ? 0.65 : 0;
  }

  setNoiseVolume(v) {
    if (!this.noiseGain) return;
    this.noiseGain.gain.value = Math.max(0, Math.min(1, v)) * 0.35;
  }

  setMusicMix(x) {
    if (!this.mixA || !this.mixB) return;
    x = clamp01(x);
    // equal-power crossfade
    const a = Math.cos((x * Math.PI) / 2);
    const b = Math.cos(((1 - x) * Math.PI) / 2);
    this.mixA.gain.value = a;
    this.mixB.gain.value = b;
  }
}

const audio = new AudioEngine();
let audioOn = false;

function applyAudioUI() {
  audioToggle.textContent = audioOn ? "Audio: On" : "Audio: Off";
  audioToggle.setAttribute("aria-pressed", String(audioOn));
}

audioToggle.addEventListener("click", async () => {
  audioOn = !audioOn;
  if (audioOn) {
    await audio.setEnabled(true);
    audio.setMaster(true);
    audio.setNoiseVolume(state.mixer.noise);
    audio.setMusicMix(state.mixer.music);
  } else {
    audio.setMaster(false);
  }
  applyAudioUI();
});

sNoise.addEventListener("input", () => {
  state.mixer.noise = clamp01(parseFloat(sNoise.value || "0"));
  if (audioOn) audio.setNoiseVolume(state.mixer.noise);
  saveStateSoon();
});
sMusic.addEventListener("input", () => {
  state.mixer.music = clamp01(parseFloat(sMusic.value || "0"));
  if (audioOn) audio.setMusicMix(state.mixer.music);
  saveStateSoon();
});

// ---------- ZenTimer ----------
const ring = /** @type {HTMLCanvasElement} */ ($("#ring"));
const ringCtx = ring.getContext("2d");
const timeReadout = $("#timeReadout");
const linearFill = $("#linearFill");
const tMinus = $("#tMinus");
const tPlus = $("#tPlus");
const tStartStop = $("#tStartStop");
const tReset = $("#tReset");

let remaining = state.timer.presetSec;
let running = false;
let lastTs = 0;

function setPresetSec(sec) {
  state.timer.presetSec = Math.max(60, Math.min(180 * 60, sec));
  if (!running) remaining = state.timer.presetSec;
  saveStateSoon();
  renderTimer();
}

function renderTimer() {
  timeReadout.textContent = fmtMMSS(remaining);
  const ratio = state.timer.presetSec > 0 ? remaining / state.timer.presetSec : 0;
  linearFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;

  if (!ringCtx) return;
  const w = ring.width, h = ring.height;
  ringCtx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 10;

  // Track
  ringCtx.lineWidth = 10;
  ringCtx.strokeStyle = "rgba(255,255,255,0.10)";
  ringCtx.beginPath();
  ringCtx.arc(cx, cy, r, 0, Math.PI * 2);
  ringCtx.stroke();

  // Progress (dissolve feel by alpha)
  const a0 = -Math.PI / 2;
  const a1 = a0 + Math.PI * 2 * ratio;
  const grad = ringCtx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "rgba(170,240,255,0.85)");
  grad.addColorStop(1, "rgba(140,170,255,0.55)");
  ringCtx.strokeStyle = grad;
  ringCtx.globalAlpha = 0.25 + 0.75 * ratio;
  ringCtx.beginPath();
  ringCtx.arc(cx, cy, r, a0, a1, false);
  ringCtx.stroke();
  ringCtx.globalAlpha = 1;
}

function step(ts) {
  if (!lastTs) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  if (running) {
    remaining -= dt;
    if (remaining <= 0) {
      remaining = 0;
      running = false;
      tStartStop.textContent = "Start";
      // subtle UI ping: reveal timer briefly
      $("#timer").setAttribute("data-active", "true");
      setTimeout(() => $("#timer").removeAttribute("data-active"), 1200);
    }
    renderTimer();
  }

  requestAnimationFrame(step);
}

tMinus.addEventListener("click", () => setPresetSec(state.timer.presetSec - 60));
tPlus.addEventListener("click", () => setPresetSec(state.timer.presetSec + 60));
tStartStop.addEventListener("click", () => {
  running = !running;
  tStartStop.textContent = running ? "Stop" : "Start";
  if (running && remaining <= 0) remaining = state.timer.presetSec;
  renderTimer();
});
tReset.addEventListener("click", () => {
  running = false;
  remaining = state.timer.presetSec;
  tStartStop.textContent = "Start";
  renderTimer();
});

// ---------- WebGL Canvas (shader rain/snow) ----------
function createGL(canvas) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error("WebGL not supported");

  const debugHud = /** @type {HTMLPreElement} */ ($("#debugHud"));
  const debug = {
    lastError: "",
    using: "fallback",
    hasTexLodExt: false,
    intensity: 0,
    mode: 0,
  };
  function renderDebug() {
    const lines = [
      `mode: ${debug.mode === 0 ? "rain" : "snow"}`,
      `using: ${debug.using}`,
      `intensity: ${debug.intensity.toFixed(2)}`,
      `EXT_shader_texture_lod: ${debug.hasTexLodExt ? "yes" : "no"}`,
      debug.lastError ? `error:\n${debug.lastError}` : "",
    ].filter(Boolean);
    debugHud.textContent = lines.join("\n");
  }

  const hasTexLodExt = !!gl.getExtension("EXT_shader_texture_lod");
  debug.hasTexLodExt = hasTexLodExt;

  // Track pointer for ShaderToy-style iMouse (xy = position, z = down?).
  const mouse = { x: 0, y: 0, down: 0 };
  const updateMouse = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / Math.max(1, r.width));
    mouse.y = (r.bottom - e.clientY) * (canvas.height / Math.max(1, r.height)); // invert y like ShaderToy
  };
  window.addEventListener("pointermove", updateMouse, { passive: true });
  window.addEventListener("pointerdown", (e) => { mouse.down = 1; updateMouse(e); }, { passive: true });
  window.addEventListener("pointerup", () => { mouse.down = 0; }, { passive: true });

  function wrapShaderToy(imageCode) {
    return `
      ${hasTexLodExt ? "#extension GL_EXT_shader_texture_lod : enable" : ""}
      precision mediump float;
      uniform vec3 iResolution;
      uniform float iTime;
      uniform vec4 iMouse;
      uniform sampler2D iChannel0;
      uniform sampler2D iChannel1;
      uniform sampler2D iChannel2;
      uniform sampler2D iChannel3;
      uniform vec3 iChannelResolution[4];
      uniform float u_intensity;

      // Optional convenience for adapting ShaderToy shaders:
      // use iIntensity in your pasted code if you want mixer control.
      #define iIntensity u_intensity

      // WebGL1: emulate/redirect ShaderToy textureLod.
      #if defined(GL_EXT_shader_texture_lod)
        #define textureLod texture2DLodEXT
      #else
        vec4 textureLod(sampler2D s, vec2 uv, float lod) { return texture2D(s, uv); }
      #endif

      ${imageCode}

      void main() {
        vec4 col = vec4(0.0);
        mainImage(col, gl_FragCoord.xy);
        gl_FragColor = col;
      }
    `;
  }

  const vsrc = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main(){
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fallbackFsrc = `
    precision mediump float;
    varying vec2 v_uv;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_mode;      // 0 rain, 1 snow
    uniform float u_intensity; // 0..1

    float hash21(vec2 p){
      p = fract(p*vec2(123.34, 456.21));
      p += dot(p, p+45.32);
      return fract(p.x*p.y);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i+vec2(1.0,0.0));
      float c = hash21(i+vec2(0.0,1.0));
      float d = hash21(i+vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }

    vec3 zenPalette(float t){
      vec3 a = vec3(0.05, 0.07, 0.12);
      vec3 b = vec3(0.10, 0.16, 0.26);
      vec3 c = vec3(0.55, 0.80, 0.95);
      vec3 d = vec3(0.40, 0.55, 0.95);
      return a + b*sin(6.2831*(c*t + d));
    }

    float rainLayer(vec2 uv, float t, float density){
      // streaks: stretch y, move down, then threshold
      vec2 p = uv;
      p.x *= 1.25;
      p.y *= 7.0;
      p.y += t * (6.0 + 10.0*density);
      float n = noise(p*3.0);
      float drop = smoothstep(0.78, 0.98, n);
      // narrow streaks
      float col = noise(vec2(p.x*12.0, floor(p.y)));
      float streak = smoothstep(0.80, 0.99, col);
      return drop * streak;
    }

    float snowLayer(vec2 uv, float t, float density){
      // drifting particles
      vec2 p = uv;
      p.y += t*(0.25 + 0.75*density);
      p.x += sin((uv.y + t*0.25)*6.0) * 0.03 * (0.2 + density);
      float n = noise(p*6.0);
      float flake = smoothstep(0.72, 0.995, n);
      // soften
      flake *= 0.35 + 0.65*noise(p*12.0);
      return flake;
    }

    void main(){
      vec2 uv = v_uv;
      vec2 px = (uv*2.0 - 1.0) * vec2(u_res.x/u_res.y, 1.0);
      float t = u_time;

      float density = clamp(u_intensity, 0.0, 1.0);

      // background gradient
      float v = 0.5 + 0.5*sin(t*0.05 + px.y*0.6);
      vec3 base = mix(vec3(0.02,0.03,0.06), vec3(0.05,0.06,0.10), v);
      base += 0.06 * zenPalette(uv.x*0.35 + uv.y*0.20);

      // subtle scanline shimmer
      float scan = 0.02 * sin((uv.y*u_res.y)*0.06 + t*1.0);
      base += scan;

      float rain = 0.0;
      rain += rainLayer(uv + vec2(0.00,0.00), t*1.0, density);
      rain += 0.6 * rainLayer(uv + vec2(0.13,0.07), t*1.2 + 10.0, density);

      float snow = 0.0;
      snow += snowLayer(uv + vec2(0.00,0.00), t, density);
      snow += 0.7 * snowLayer(uv + vec2(0.22,0.11), t*1.17 + 4.0, density);

      float m = step(0.5, u_mode); // 0 rain, 1 snow
      float pfx = mix(rain, snow, m);

      // tone and bloom-ish
      vec3 fxCol = mix(vec3(0.55,0.80,1.00), vec3(0.92,0.96,1.00), m);
      vec3 col = base + fxCol * pfx * (0.35 + 1.25*density);
      col += fxCol * pow(pfx, 2.0) * 0.55;

      // vignette
      float vig = smoothstep(1.15, 0.55, length(px));
      col *= 0.80 + 0.20*vig;

      gl_FragColor = vec4(col, 1.0);
    }
  `;
  const shadertoyFsrc = SHADERTOY_RAIN_IMAGE_CODE ? wrapShaderToy(SHADERTOY_RAIN_IMAGE_CODE) : null;
  const shadertoySnowFsrc = SHADERTOY_SNOW_IMAGE_CODE ? wrapShaderToy(SHADERTOY_SNOW_IMAGE_CODE) : null;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh) || "shader error";
      gl.deleteShader(sh);
      throw new Error(info);
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, vsrc);

  function linkProgram(fragmentSrc) {
    try {
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) || "program link error");
      }
      return prog;
    } catch (e) {
      debug.lastError = String(e && e.message ? e.message : e);
      renderDebug();
      return null;
    }
  }

  const progFallback = linkProgram(fallbackFsrc) || (() => { throw new Error("Fallback shader failed to compile"); })();
  const progShaderToyRain = shadertoyFsrc ? linkProgram(shadertoyFsrc) : null;
  const progShaderToySnow = shadertoySnowFsrc ? linkProgram(shadertoySnowFsrc) : null;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1,  -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

  function getLocations(prog) {
    return {
      aPos: gl.getAttribLocation(prog, "a_pos"),
      // fallback uniforms
      uRes: gl.getUniformLocation(prog, "u_res"),
      uTime: gl.getUniformLocation(prog, "u_time"),
      uMode: gl.getUniformLocation(prog, "u_mode"),
      uIntensity: gl.getUniformLocation(prog, "u_intensity"),
      // shadertoy uniforms
      iResolution: gl.getUniformLocation(prog, "iResolution"),
      iTime: gl.getUniformLocation(prog, "iTime"),
      iMouse: gl.getUniformLocation(prog, "iMouse"),
      iChannel0: gl.getUniformLocation(prog, "iChannel0"),
      iChannelResolution0: gl.getUniformLocation(prog, "iChannelResolution[0]"),
    };
  }

  const locFallback = getLocations(progFallback);
  const locToyRain = progShaderToyRain ? getLocations(progShaderToyRain) : null;
  const locToySnow = progShaderToySnow ? getLocations(progShaderToySnow) : null;

  let mode = 0; // 0 rain, 1 snow
  let intensity = 0.72;

  // Minimal iChannel0 background texture (procedural "city lights" gradient).
  function makeBackgroundTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");

    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#040813");
    g.addColorStop(0.55, "#081429");
    g.addColorStop(1, "#02030a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // soft bokeh dots
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1.5 + Math.random() * 10;
      const a = 0.04 + Math.random() * 0.12;
      const hue = 190 + Math.random() * 80;
      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle horizontal glow band
    ctx.globalCompositeOperation = "screen";
    const g2 = ctx.createLinearGradient(0, size * 0.55, 0, size * 0.9);
    g2.addColorStop(0, "rgba(80,160,255,0.00)");
    g2.addColorStop(0.5, "rgba(80,160,255,0.10)");
    g2.addColorStop(1, "rgba(80,160,255,0.00)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return { tex, w: size, h: size };
  }

  const bg = makeBackgroundTexture();

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(t) {
    resize();
    const useToy = (mode === 0 && progShaderToyRain) || (mode === 1 && progShaderToySnow);
    const prog = useToy
      ? (mode === 0 ? progShaderToyRain : progShaderToySnow)
      : progFallback;
    const loc = useToy
      ? (mode === 0 ? locToyRain : locToySnow)
      : locFallback;

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc.aPos);
    gl.vertexAttribPointer(loc.aPos, 2, gl.FLOAT, false, 0, 0);

    if (useToy) {
      if (loc.iResolution) gl.uniform3f(loc.iResolution, canvas.width, canvas.height, 1.0);
      if (loc.iTime) gl.uniform1f(loc.iTime, t);
      // For Heartfelt: use mixer intensity as Mouse.y to control rain amount.
      // For Just snow: allow panning with real mouse.
      if (loc.iMouse) {
        const mx = mouse.x;
        const my = (mode === 0) ? (intensity * canvas.height) : mouse.y;
        const mz = (mode === 0) ? 1.0 : (mouse.down ? 1.0 : 0.0);
        gl.uniform4f(loc.iMouse, mx, my, mz, 0.0);
      }
      if (loc.uIntensity) gl.uniform1f(loc.uIntensity, intensity);

      if (loc.iChannel0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bg.tex);
        gl.uniform1i(loc.iChannel0, 0);
      }
      if (loc.iChannelResolution0) gl.uniform3f(loc.iChannelResolution0, bg.w, bg.h, 1.0);
    } else {
      if (loc.uRes) gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      if (loc.uTime) gl.uniform1f(loc.uTime, t);
      if (loc.uMode) gl.uniform1f(loc.uMode, mode);
      if (loc.uIntensity) gl.uniform1f(loc.uIntensity, intensity);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    debug.mode = mode;
    debug.intensity = intensity;
    debug.using = useToy ? (mode === 0 ? "shadertoy-rain" : "shadertoy-snow") : "fallback";
    renderDebug();
  }

  return {
    tick(timeSec) { draw(timeSec); },
    setMode(m) { mode = m === "snow" ? 1 : 0; },
    setIntensity(x) { intensity = clamp01(x); },
  };
}

// ---------- Boot ----------
loadState();
applyModeUI();
applyFontUI();

const gl = createGL(/** @type {HTMLCanvasElement} */ ($("#gl")));
gl.setMode(state.mode);
gl.setIntensity(state.mixer.intensity);
applyMixerUI();
applyAudioUI();

remaining = state.timer.presetSec;
renderTimer();
requestAnimationFrame(step);

let t0 = performance.now();
function renderBG(now) {
  const t = (now - t0) / 1000;
  gl.tick(t);
  requestAnimationFrame(renderBG);
}
requestAnimationFrame(renderBG);

// Keep mixer subtly discoverable: activate when cursor near right edge (hidden logic, not a big button)
window.addEventListener("mousemove", (e) => {
  const nearRight = (window.innerWidth - e.clientX) < 26;
  if (nearRight) mixer.setAttribute("data-active", "true");
  else if (!mixer.matches(":hover") && !mixer.matches(":focus-within")) mixer.removeAttribute("data-active");
});

