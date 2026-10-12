// Shared, mutable state of the river journey. Journey.tsx writes it from scroll;
// River.tsx (the shader) and the paper boats read it every frame. Plain numbers, no React.
export const journey = {
  x: 0, // how far the world has travelled, px
  sourceX: 0, // world px where the two streams spring from the mountains
  confluenceX: 1e6, // world px where they meet
  progress: 0, // 0 at the source, 1 at journey's end
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// The paper warms from dawn to dusk along the way
const PAPER = [
  [244, 238, 228], // dawn
  [247, 240, 224], // day
  [244, 224, 196], // golden hour
  [234, 207, 192], // dusk
];
export function paperAt(t: number): [number, number, number] {
  const f = Math.min(0.9999, Math.max(0, t)) * (PAPER.length - 1);
  const i = Math.floor(f);
  const a = PAPER[i];
  const b = PAPER[i + 1];
  return [mix(a[0], b[0], f - i), mix(a[1], b[1], f - i), mix(a[2], b[2], f - i)];
}

// Scroll to a chapter: panels inside the horizontal journey map 1px of travel to 1px of scroll
export function scrollToChapter(id: string) {
  const el = document.getElementById(id);
  const world = document.getElementById("journey");
  if (!el || !world) return;
  const top = world.getBoundingClientRect().top + window.scrollY;
  const inside = world.contains(el) && el !== world;
  const max = world.offsetHeight - window.innerHeight;
  window.scrollTo({
    top: inside ? top + Math.min(el.offsetLeft, max) : el.getBoundingClientRect().top + window.scrollY,
    behavior: "smooth",
  });
}
