"use strict";


/* =================================
EMMY SENSITIVITY PRO X V6
================================= */


const DEFAULT_SENSITIVITY = {
"General": 190,
"Red Dot": 185,
"2x Scope": 180,
"4x Scope": 170,
"Sniper Scope": 100,
"Free Look": 150
};


const PLAYSTYLES = {
balanced: [0, 0, 0, 0, 0, 0],
rush: [8, 7, 5, 2, -5, 5],
"one-tap": [5, 8, 5, 0, -8, 0],
sniper: [-8, -5, -5, -8, 8, -5],
support: [-3, -2, 0, 3, 5, 3]
};


const DEVICE_PRESETS = {
standard: 0,
low: -8,
mid: 0,
high: 5
};


const RAM_MODIFIERS = {
2: -6,
3: -4,
4: -2,
6: 0,
8: 2,
12: 3,
16: 4,
24: 4
};


const STORAGE = {
identity: "emmy_identity",
sensitivity: "emmy_sensitivity",
profiles: "emmy_profiles",
generations: "emmy_generations",
hud: "emmy_hud"
};


let currentSensitivity = { ...DEFAULT_SENSITIVITY };
let generatedSensitivity = null;
let toastTimer;


/* =================================
STORAGE HELPERS
================================= */


function saveData(key, value) {
localStorage.setItem(key, JSON.stringify(value));
}


function getData(key, fallback) {
try {
const data = localStorage.getItem(key);
return data ? JSON.parse(data) : fallback;
} catch (error) {
return fallback;
}
}


function clamp(value) {
return Math.max(0, Math.min(200, Math.round(value)));
}


/* =================================
NOTIFICATIONS
================================= */


function showToast(message) {
const toast = document.getElementById("toast");


if (!toast) return;

toast.textContent = message;
toast.classList.add("show");

clearTimeout(toastTimer);

toastTimer = setTimeout(() => {
    toast.classList.remove("show");
}, 2500);



}


/* =================================
PAGE NAVIGATION
================================= */


function openPage(pageId) {
document.querySelectorAll(".page").forEach(page => {
page.classList.toggle("active", page.id === pageId);
});


document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
        "active",
        button.dataset.page === pageId
    );
});



}


/* =================================
GAMER PROFILE
================================= */


function saveIdentity() {
const identity = {
nickname: document.getElementById("nickname").value.trim(),
device: document.getElementById("device").value.trim(),
ram: document.getElementById("ram").value,
dpi: document.getElementById("dpi").value
};


saveData(STORAGE.identity, identity);

showToast("Gamer profile saved!");
updateDashboard();



}


function loadIdentity() {
const identity = getData(STORAGE.identity, {});


document.getElementById("nickname").value =
    identity.nickname || "";

document.getElementById("device").value =
    identity.device || "";

document.getElementById("ram").value =
    identity.ram || "4";

document.getElementById("dpi").value =
    identity.dpi || "";



}


/* =================================
DASHBOARD
================================= */


function updateDashboard() {
const generations =
Number(localStorage.getItem(STORAGE.generations) || 0);


const counter = document.getElementById("generationCount");

if (counter) {
    counter.textContent = generations;
}



}


/* =================================
SENSITIVITY GENERATOR V6
================================= */


function generateSensitivity() {
const style = document.getElementById("generatorStyle").value;


const device = document.getElementById("devicePreset").value;

const phone = document.getElementById("generatorDevice").value.trim();

const ram = document.getElementById("generatorRam").value;

const styleValues = PLAYSTYLES[style];

const deviceModifier = DEVICE_PRESETS[device];

const ramModifier = RAM_MODIFIERS[ram] ?? 0;

if (!styleValues || deviceModifier === undefined) {
    showToast("Please select valid settings.");
    return;
}

if (!phone) {
    showToast("Please enter your phone model.");
    return;
}

const names = Object.keys(DEFAULT_SENSITIVITY);
const result = {};

names.forEach((name, index) => {
    result[name] = clamp(
        DEFAULT_SENSITIVITY[name] +
        styleValues[index] +
        deviceModifier +
        ramModifier
    );
});

currentSensitivity = { ...result };
generatedSensitivity = { ...result };

const count =
    Number(localStorage.getItem(STORAGE.generations) || 0) + 1;

localStorage.setItem(STORAGE.generations, count);

document.getElementById("resultStatus").textContent = "GENERATED";

displaySensitivity(result);

loadLabValues(result);

saveData(STORAGE.sensitivity, result);

updateDashboard();

showToast("Settings generated for " + phone + "!");



}


/* =================================
DISPLAY SENSITIVITY
================================= */


function displaySensitivity(data) {
const container = document.getElementById("generatedValues");


if (!container) return;

container.innerHTML = "";

Object.entries(data).forEach(([name, value]) => {
    const item = document.createElement("div");
    item.className = "sensi-item";

    const title = document.createElement("span");
    title.textContent = name;

    const number = document.createElement("strong");
    number.textContent = value;

    item.appendChild(title);
    item.appendChild(number);

    container.appendChild(item);
});



}


/* =================================
COPY SETTINGS
================================= */


async function copySettings() {
if (!generatedSensitivity) {
showToast("Generate settings first.");
return;
}


const text = Object.entries(generatedSensitivity)
    .map(([name, value]) => `${name}: ${value}`)
    .join("\n");

try {
    await navigator.clipboard.writeText(text);
    showToast("Settings copied!");
} catch (error) {
    const temporary = document.createElement("textarea");

    temporary.value = text;

    document.body.appendChild(temporary);
    temporary.select();

    const copied = document.execCommand("copy");

    temporary.remove();

    showToast(
        copied ? "Settings copied!" : "Unable to copy settings."
    );
}



}


/* =================================
SENSITIVITY LAB
================================= */


const SLIDERS = {
"General": "labGeneral",
"Red Dot": "labRed",
"2x Scope": "lab2x",
"4x Scope": "lab4x",
"Sniper Scope": "labSniper",
"Free Look": "labFree"
};


function loadLabValues(data) {
Object.entries(SLIDERS).forEach(([name, id]) => {
const slider = document.getElementById(id);


    if (!slider) return;

    slider.value = data[name] ?? DEFAULT_SENSITIVITY[name];

    updateSlider(slider);
});



}


function updateSlider(slider) {
const output = document.getElementById(slider.id + "Value");


if (output) {
    output.textContent = slider.value;
}



}


function getLabValues() {
const result = {};


Object.entries(SLIDERS).forEach(([name, id]) => {
    const slider = document.getElementById(id);

    if (slider) {
        result[name] = clamp(Number(slider.value));
    }
});

return result;



}


function applyLabSettings() {
currentSensitivity = getLabValues();


saveData(STORAGE.sensitivity, currentSensitivity);

displaySensitivity(currentSensitivity);

generatedSensitivity = { ...currentSensitivity };

document.getElementById("resultStatus").textContent = "CUSTOM";

showToast("Your settings have been applied!");



}


function resetLab() {
currentSensitivity = { ...DEFAULT_SENSITIVITY };


loadLabValues(DEFAULT_SENSITIVITY);

saveData(STORAGE.sensitivity, currentSensitivity);

showToast("Sensitivity reset!");



}


/* =================================
PROFILES
================================= */


function saveProfile() {
const input = document.getElementById("profileName");
const name = input.value.trim();


if (!name) {
    showToast("Enter a profile name.");
    return;
}

const profiles = getData(STORAGE.profiles, []);

profiles.push({
    id: Date.now(),
    name: name,
    settings: getLabValues()
});

saveData(STORAGE.profiles, profiles);

input.value = "";

renderProfiles();

showToast("Profile saved!");



}


function renderProfiles() {
const container = document.getElementById("profilesList");


const profiles = getData(STORAGE.profiles, []);

container.innerHTML = "";

if (profiles.length === 0) {
    container.textContent = "No saved profiles yet.";
    return;
}

profiles.forEach(profile => {
    const item = document.createElement("div");
    item.className = "profile-item";

    const name = document.createElement("strong");
    name.textContent = profile.name;

    const actions = document.createElement("div");
    actions.className = "profile-actions";

    const load = document.createElement("button");
    load.className = "secondary";
    load.textContent = "Load";
    load.onclick = () => loadProfile(profile.id);

    const rename = document.createElement("button");
    rename.className = "secondary";
    rename.textContent = "Rename";
    rename.onclick = () => renameProfile(profile.id);

    const remove = document.createElement("button");
    remove.className = "danger";
    remove.textContent = "Delete";
    remove.onclick = () => deleteProfile(profile.id);

    actions.append(load, rename, remove);

    item.append(name, actions);

    container.appendChild(item);
});



}


function loadProfile(id) {
const profiles = getData(STORAGE.profiles, []);


const profile = profiles.find(item => item.id === id);

if (!profile) return;

currentSensitivity = { ...profile.settings };
generatedSensitivity = { ...profile.settings };

loadLabValues(profile.settings);

displaySensitivity(profile.settings);

saveData(STORAGE.sensitivity, profile.settings);

document.getElementById("resultStatus").textContent = "CUSTOM";

showToast("Profile loaded!");



}


function renameProfile(id) {
const profiles = getData(STORAGE.profiles, []);


const profile = profiles.find(item => item.id === id);

if (!profile) return;

const newName = prompt("Enter new profile name:", profile.name);

if (!newName || !newName.trim()) return;

profile.name = newName.trim();

saveData(STORAGE.profiles, profiles);

renderProfiles();

showToast("Profile renamed!");



}


function deleteProfile(id) {
const profiles = getData(STORAGE.profiles, [])
.filter(item => item.id !== id);


saveData(STORAGE.profiles, profiles);

renderProfiles();

showToast("Profile deleted!");



}


/* =================================
EXPORT / IMPORT
================================= */


function exportBackup() {
const backup = {
app: "Emmy Sensitivity Pro X V6",
profiles: getData(STORAGE.profiles, []),
sensitivity: currentSensitivity
};


const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
);

const url = URL.createObjectURL(blob);

const link = document.createElement("a");

link.href = url;
link.download = "emmy-sensitivity-v6-backup.json";

link.click();

URL.revokeObjectURL(url);

showToast("Backup exported!");



}


function importBackup(event) {
const file = event.target.files[0];


if (!file) return;

const reader = new FileReader();

reader.onload = () => {
    try {
        const backup = JSON.parse(reader.result);

        if (!Array.isArray(backup.profiles)) {
            throw new Error("Invalid backup");
        }

        saveData(STORAGE.profiles, backup.profiles);

        if (backup.sensitivity) {
            currentSensitivity = backup.sensitivity;

            generatedSensitivity = { ...backup.sensitivity };

            saveData(STORAGE.sensitivity, currentSensitivity);

            loadLabValues(currentSensitivity);

            displaySensitivity(currentSensitivity);
        }

        renderProfiles();

        showToast("Backup imported!");

    } catch (error) {
        showToast("Invalid backup file.");
    }

    event.target.value = "";
};

reader.readAsText(file);



}


/* =================================
HUD STUDIO V6
================================= */


function fixHudNesting() {
const hudArea = document.getElementById("hudArea");


if (!hudArea) return;

// Ensure every HUD control is a direct child of the HUD area.
document.querySelectorAll(".hud-control").forEach(control => {
    if (control.parentElement !== hudArea) {
        hudArea.appendChild(control);
    }
});



}


function saveHUD() {
const controls = document.querySelectorAll("#hudArea > .hud-control");


const layout = Array.from(controls).map(control => ({
    name: control.dataset.name,
    left: control.style.left,
    top: control.style.top
}));

saveData(STORAGE.hud, layout);

showToast("HUD layout saved!");



}


function loadHUD() {
const layout = getData(STORAGE.hud, []);


layout.forEach(saved => {
    const control = Array.from(
        document.querySelectorAll("#hudArea > .hud-control")
    ).find(item => item.dataset.name === saved.name);

    if (!control) return;

    control.style.left = saved.left;
    control.style.top = saved.top;
});



}


function resetHUD() {
const controls = document.querySelectorAll("#hudArea > .hud-control");


controls.forEach((control, index) => {
    control.style.left = `${10 + (index % 3) * 30}%`;
    control.style.top = `${15 + Math.floor(index / 3) * 30}%`;
});

localStorage.removeItem(STORAGE.hud);

showToast("HUD layout reset!");



}


function enableHUDDragging() {
document.querySelectorAll("#hudArea > .hud-control").forEach(control => {
let startX = 0;
let startY = 0;
let originalLeft = 0;
let originalTop = 0;
let dragging = false;


    control.addEventListener("pointerdown", event => {
        const area = document.getElementById("hudArea");

        const bounds = area.getBoundingClientRect();

        const controlBounds = control.getBoundingClientRect();

        startX = event.clientX;
        startY = event.clientY;

        originalLeft = controlBounds.left - bounds.left;
        originalTop = controlBounds.top - bounds.top;

        dragging = true;

        control.setPointerCapture(event.pointerId);
    });

    control.addEventListener("pointermove", event => {
        if (!dragging) return;

        if (!control.hasPointerCapture(event.pointerId)) return;

        const area = document.getElementById("hudArea");

        const bounds = area.getBoundingClientRect();

        const left = originalLeft + event.clientX - startX;

        const top = originalTop + event.clientY - startY;

        const maxLeft = bounds.width - control.offsetWidth;

        const maxTop = bounds.height - control.offsetHeight;

        control.style.left =
            `${Math.max(0, Math.min(maxLeft, left))}px`;

        control.style.top =
            `${Math.max(0, Math.min(maxTop, top))}px`;
    });

    control.addEventListener("pointerup", () => {
        dragging = false;
    });

    control.addEventListener("pointercancel", () => {
        dragging = false;
    });
});



}


/* =================================
EVENT LISTENERS
================================= */


function connectEvents() {


document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.open);
    });
});

document.getElementById("saveIdentityBtn")
    .addEventListener("click", saveIdentity);

document.getElementById("generateBtn")
    .addEventListener("click", generateSensitivity);

document.getElementById("copyBtn")
    .addEventListener("click", copySettings);

document.getElementById("applyLabBtn")
    .addEventListener("click", applyLabSettings);

document.getElementById("resetLabBtn")
    .addEventListener("click", resetLab);

document.getElementById("saveProfileBtn")
    .addEventListener("click", saveProfile);

document.getElementById("exportBtn")
    .addEventListener("click", exportBackup);

document.getElementById("importFile")
    .addEventListener("change", importBackup);

document.getElementById("saveHudBtn")
    .addEventListener("click", saveHUD);

document.getElementById("resetHudBtn")
    .addEventListener("click", resetHUD);

document.querySelectorAll(".slider-group input").forEach(slider => {
    slider.addEventListener("input", () => updateSlider(slider));
});



}


/* =================================
APP STARTUP
================================= */


function initializeApp() {
loadIdentity();


// Load the saved Home device and RAM into the Generator
const identity = getData(STORAGE.identity, {});

const generatorDevice = document.getElementById("generatorDevice");
const generatorRam = document.getElementById("generatorRam");

if (generatorDevice && identity.device) {
    generatorDevice.value = identity.device;
}

if (generatorRam && identity.ram) {
    generatorRam.value = identity.ram;
}

currentSensitivity = getData(
    STORAGE.sensitivity,
    { ...DEFAULT_SENSITIVITY }
);

generatedSensitivity = { ...currentSensitivity };

loadLabValues(currentSensitivity);

displaySensitivity(currentSensitivity);

renderProfiles();

fixHudNesting();

loadHUD();

enableHUDDragging();

connectEvents();

updateDashboard();

console.log("Emmy Sensitivity Pro X V6 is ready!");



}


document.addEventListener("DOMContentLoaded", initializeApp);


