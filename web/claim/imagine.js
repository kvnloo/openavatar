const form = document.querySelector("#imagine");
const presetsEl = document.querySelector("#presets");
const preview = document.querySelector("#preview");
const result = document.querySelector("#result");
const promptEl = document.querySelector("#prompt");
const status = document.querySelector("#status");
const save = document.querySelector("#save");

let universe = "star-wars";
let photoData = "";

form.token.value = localStorage.getItem("openavatar.hf_token") || "";

const claimed = JSON.parse(localStorage.getItem("openavatar.card") || "null");

async function loadPresets() {
  let data;
  for (const url of ["/api/imagine/presets", "./presets.json"]) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        data = await res.json();
        break;
      }
    } catch {
      /* try next */
    }
  }
  if (!data?.presets) {
    throw new Error("Could not load universes.");
  }
  for (const item of data.presets) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.dataset.id = item.id;
    chip.style.setProperty("--still", `url("./media/universe-${item.id}.jpg")`);
    chip.setAttribute("aria-pressed", item.id === universe ? "true" : "false");
    chip.title = item.hint;
    const still = document.createElement("span");
    still.className = "chip-still";
    still.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "chip-label";
    label.textContent = item.label;
    chip.append(still, label);
    chip.addEventListener("click", () => {
      universe = item.id;
      for (const other of presetsEl.querySelectorAll(".chip")) {
        other.setAttribute("aria-pressed", other === chip ? "true" : "false");
      }
    });
    presetsEl.append(chip);
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(file);
  });
}

async function setPhoto(file) {
  if (!file) return;
  photoData = await readFile(file);
  preview.hidden = false;
  preview.innerHTML = `<img class="photo" alt="Your reference" src="${photoData}" />`;
}

form.photo.addEventListener("change", () => setPhoto(form.photo.files[0]));
form.camera.addEventListener("change", () => setPhoto(form.camera.files[0]));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.hidden = true;
  save.hidden = true;
  if (!photoData) {
    status.hidden = false;
    status.classList.add("err");
    status.classList.remove("ok");
    status.textContent = "Add a photo of you first (camera or camera roll).";
    return;
  }
  const token = form.token.value.trim();
  if (token) localStorage.setItem("openavatar.hf_token", token);
  status.hidden = false;
  status.classList.remove("err");
  status.classList.add("ok");
  status.textContent = "Sending to Hugging Face — this can take a minute…";
  try {
    const res = await fetch("/api/imagine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: photoData,
        universe,
        hobbies: form.hobbies.value,
        extra: form.extra.value,
        displayName: claimed?.displayName || "",
        token,
      }),
    });
    const data = await res.json();
    if (data.prompt) promptEl.textContent = data.prompt;
    if (!res.ok) {
      status.classList.add("err");
      status.classList.remove("ok");
      status.textContent = data.detail || data.hint || data.error || res.statusText;
      return;
    }
    result.hidden = false;
    result.src = data.image;
    save.hidden = false;
    save.href = data.image;
    save.download = `${universe}.openavatar.png`;
    status.classList.remove("err");
    status.classList.add("ok");
    status.textContent = `Done via ${data.provider} (${data.model}).`;
    const file = await (await fetch(data.image)).blob();
    if (navigator.canShare?.({ files: [new File([file], save.download, { type: file.type })] })) {
      save.textContent = "Share / Save";
      save.onclick = async (ev) => {
        ev.preventDefault();
        await navigator.share({
          files: [new File([file], save.download, { type: file.type || "image/png" })],
          title: universe,
        });
      };
    }
  } catch (error) {
    status.classList.add("err");
    status.classList.remove("ok");
    status.textContent = error.message;
  }
});

loadPresets().catch((error) => {
  status.hidden = false;
  status.classList.add("err");
  status.classList.remove("ok");
  status.textContent = error.message;
});
