export type StudioTool = {
  id: string;
  name: string;
  surface: "likeness" | "voice" | "both";
  local: boolean;
  summary: string;
  url: string;
  recipe: string;
};

export const STUDIO_TOOLS: StudioTool[] = [
  {
    id: "kokoro",
    name: "Kokoro",
    surface: "voice",
    local: true,
    summary: "Local OpenAI-compatible TTS. Open Avatar stores a pointer, not audio.",
    url: "https://github.com/hexgrad/kokoro",
    recipe:
      "Run Kokoro on loopback (`POST /v1/audio/speech`). Put the voice id on your card. Open Avatar never hosts the wav.",
  },
  {
    id: "whisper",
    name: "Faster Whisper",
    surface: "voice",
    local: true,
    summary: "Local ASR for the studio loop. Recognition stays on your machine.",
    url: "https://github.com/SYSTRAN/faster-whisper",
    recipe:
      "Keep the model in a local venv. Point `ZERO_WHISPER_PYTHON` if you already run zer0-voice.",
  },
  {
    id: "zer0-voice",
    name: "zer0-voice",
    surface: "voice",
    local: true,
    summary: "Thin adapter over Whisper + Kokoro. Do not copy models into this repo.",
    url: "https://github.com/kvnloo/zer0-voice",
    recipe: "Use the adapter as a sidecar. Open Avatar only records that you use it.",
  },
  {
    id: "instantid",
    name: "InstantID",
    surface: "likeness",
    local: true,
    summary: "Identity-preserving generation you run locally (ComfyUI / diffusers).",
    url: "https://github.com/InstantID/InstantID",
    recipe:
      "Keep source photos off this server. Publish a tool id + optional local note, not the face.",
  },
  {
    id: "liveportrait",
    name: "LivePortrait",
    surface: "likeness",
    local: true,
    summary: "Local talking-head animation from a still you already own.",
    url: "https://github.com/KwaiVGI/LivePortrait",
    recipe: "Animate locally. The public card links the tool, not the frames.",
  },
  {
    id: "liveportrait-onnx",
    name: "LivePortrait (ONNX)",
    surface: "likeness",
    local: true,
    summary: "CPU-friendlier LivePortrait path for machines without a fat CUDA stack.",
    url: "https://github.com/KlingTeam/LivePortrait",
    recipe: "Same contract: local render, public pointer.",
  },
];

export function studioTool(id: string): StudioTool | undefined {
  return STUDIO_TOOLS.find((tool) => tool.id === id);
}
