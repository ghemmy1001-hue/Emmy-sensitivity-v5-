const $ = id => document.getElementById(id);

const DEFAULTS = {
    General: 190,
    "Red Dot": 185,
    "2x Scope": 180,
    "4x Scope": 170,
    "Sniper Scope": 100,
    "Free Look": 150
};

const KEYS = Object.keys(DEFAULTS);
const STORAGE_KEY = "emmyProX_v6";

let current = {...DEFAULTS};
let generated = false;

function readData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function writeData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function clamp(value) {
    return Math.max(0, Math.min(200, Math.round(value)));
}

// NAVIGATION
document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

        button.classList.add("active");
        $(button.dataset.page).classList.add("active");
    });
});

// SENSI LAB
function renderSliders() {
    $("sliders").innerHTML = KEYS.map(key => `
        <div class="slider-box">
            <div class="slider-title">
                <span>${key}</span>
                <strong id="value-${key}">${current[key]}</strong>
            </div>
            <input type="range" min="0" max="200" value="${current[key]}"
                data-key="${key}" aria-label="${key} sensitivity">
        </div>
    `).join("");

    $("sliders").querySelectorAll("input").forEach(slider => {
        slider.addEventListener("input", () => {
            const key = slider.dataset.key;
            current[key] = Number(slider.value);
            $("value-" + key).textContent = slider.value;
        });
    });
}

function showResults(values) {
    $("results").innerHTML = KEYS.map(key => `
        <div class="result-item">
            <span>${key}</span>
            <strong>${values[key]}</strong>
        </div>
    `).join("");
}

function readLabValues() {
    $("sliders").querySelectorAll("input").forEach(slider => {
        current[slider.dataset.key] = Number(slider.value);
    });
}

// GENERATOR
function generateSettings() {
    const device = $("device").value.trim();
    const ram = Number($("ram").value);
    const style = $("style").value;
    const performance = $("performance").value;

    if (!device) {
        notify("Enter your phone model first.");
        $("device").focus();
        return;
    }

    const ramAdjustment = {
        2: -7, 3: -5, 4: -3, 6: 0,
        8: 2, 12: 3, 16: 4, 24: 4
    };

    const performanceAdjustment = {
        low: -5,
        standard: 0,
        high: 4
    };

    const styleAdjustment = {
        balanced: [0, 0, 0, 0, 0, 0],
        rush: [5, 6, 5, 3, -3, 2],
        onetap: [7, 8, 4, 2, -5, 0],
        sniper: [-4, -5, -3, 4, 8, -2],
        support: [-2, -2, -1, 0, 2, 3]
    };

    const adjustment =
        ramAdjustment[ram] + performanceAdjustment[performance];

    const styleValues = styleAdjustment[style];

    current = {};

    KEYS.forEach((key, index) => {
        current[key] = clamp(
            DEFAULTS[key] + adjustment + styleValues[index]
        );
    });

    generated = true;
    showResults(current);
    renderSliders();
    notify("Settings generated for " + device + "!");
}

$("generateBtn").addEventListener("click", generateSettings);

$("copyBtn").addEventListener("click", async () => {
    if (!generated) {
        notify("Generate settings first.");
        return;
    }

    const text = "EMMY SENSITIVITY PRO X V6\n" +
        KEYS.map(key => `${key}: ${current[key]}`).join("\n");

    try {
        await navigator.clipboard.writeText(text);
        notify("Settings copied!");
    } catch {
        const area = document.createElement("textarea");
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        notify("Settings copied!");
    }
});

$("useSettingsBtn").addEventListener("click", () => {
    renderSliders();
    document.querySelector('[data-page="lab"]').click();
    notify("Ready to edit in Sensi Lab.");
});

$("saveLabBtn").addEventListener("click", () => {
    readLabValues();
    const data = readData();
    data.settings = current;
    writeData(data);
    showResults(current);
    notify("Sensitivity saved!");
});

$("resetLabBtn").addEventListener("click", () => {
    current = {...DEFAULTS};
    generated = false;
    renderSliders();
    showResults(current);
    notify("Default values restored.");
});

// PROFILES
function renderProfiles() {
    const profiles = readData().profiles || [];

    if (!profiles.length) {
        $("profileList").innerHTML =
            '<div class="card empty">No saved profiles yet.</div>';
        return;
    }

    $("profileList").innerHTML = profiles.map((profile, index) => `
        <div class="profile-item">
            <h4>${escapeHTML(profile.name)}</h4>
            <p>${KEYS.map(k => `${k}: ${profile.settings[k]}`).join(" · ")}</p>
            <button data-load="${index}">LOAD</button>
            <button data-delete="${index}">DELETE</button>
        </div>
    `).join("");

    $("profileList").querySelectorAll("[data-load]").forEach(button => {
        button.addEventListener("click", () => {
            const profile = profiles[Number(button.dataset.load)];
            current = {...profile.settings};
            generated = true;
            renderSliders();
            showResults(current);
            notify("Profile loaded!");
            document.querySelector('[data-page="lab"]').click();
        });
    });

    $("profileList").querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => {
            const data = readData();
            data.profiles.splice(Number(button.dataset.delete), 1);
            writeData(data);
            renderProfiles();
            notify("Profile deleted.");
        });
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

$("saveProfileBtn").addEventListener("click", () => {
    const name = $("profileName").value.trim();

    if (!name) {
        notify("Enter a profile name.");
        return;
    }

    readLabValues();

    const data = readData();
    data.profiles = data.profiles || [];
    data.profiles.push({name, settings: {...current}});
    writeData(data);

    $("profileName").value = "";
    renderProfiles();
    notify("Profile saved!");
});

// BACKUP
$("exportBtn").addEventListener("click", () => {
    const backup = JSON.stringify(readData(), null, 2);
    const blob = new Blob([backup], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "emmy-pro-v6-backup.json";
    link.click();

    URL.revokeObjectURL(url);
    notify("Backup exported!");
});

$("importFile").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const backup = JSON.parse(await file.text());

        if (typeof backup !== "object" || backup === null) {
            throw new Error("Invalid backup");
        }

        if (backup.settings) {
            for (const key of KEYS) {
                if (!Number.isFinite(backup.settings[key])) {
                    throw new Error("Invalid settings");
                }
            }
        }

        if (backup.profiles && !Array.isArray(backup.profiles)) {
            throw new Error("Invalid profiles");
        }

        writeData(backup);
        current = {...DEFAULTS, ...(backup.settings || {})};
        renderSliders();
        showResults(current);
        renderProfiles();
        notify("Backup imported!");
    } catch {
        notify("Invalid backup file.");
    }

    event.target.value = "";
});

// HUD STUDIO
const hudDefaults = {
    Fire: [83, 70],
    Jump: [85, 28],
    Crouch: [64, 78],
    Scope: [66, 22],
    Joystick: [16, 70],
    "Gloo Wall": [76, 48]
};

function saveHudPositions() {
    const positions = {};
    document.querySelectorAll(".hud-control").forEach(control => {
        positions[control.dataset.name] = {
            x: parseFloat(control.style.left),
            y: parseFloat(control.style.top)
        };
    });
    const data = readData();
    data.hud = positions;
    writeData(data);
}

function loadHudPositions() {
    const saved = readData().hud || {};

    document.querySelectorAll(".hud-control").forEach(control => {
        const name = control.dataset.name;
        const position = saved[name] || {
            x: hudDefaults[name][0],
            y: hudDefaults[name][1]
        };

        control.style.left = position.x + "%";
        control.style.top = position.y + "%";
    });
}

function enableHudDragging() {
    document.querySelectorAll(".hud-control").forEach(control => {
        let dragging = false;

        control.addEventListener("pointerdown", event => {
            dragging = true;
            control.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        control.addEventListener("pointermove", event => {
            if (!dragging) return;

            const area = $("hudArea").getBoundingClientRect();
            const x = ((event.clientX - area.left) / area.width) * 100;
            const y = ((event.clientY - area.top) / area.height) * 100;

            control.style.left = Math.max(7, Math.min(93, x)) + "%";
            control.style.top = Math.max(9, Math.min(91, y)) + "%";
        });

        function stopDragging() {
            dragging = false;
        }

        control.addEventListener("pointerup", stopDragging);
        control.addEventListener("pointercancel", stopDragging);
    });
}

$("saveHudBtn").addEventListener("click", () => {
    saveHudPositions();
    notify("HUD layout saved!");
});

$("resetHudBtn").addEventListener("click", () => {
    document.querySelectorAll(".hud-control").forEach(control => {
        const position = hudDefaults[control.dataset.name];
        control.style.left = position[0] + "%";
        control.style.top = position[1] + "%";
    });

    saveHudPositions();
    notify("HUD reset!");
});

// RESET APP
$("resetAllBtn").addEventListener("click", () => {
    if (!confirm("Delete all Emmy Pro V6 saved data?")) return;

    localStorage.removeItem(STORAGE_KEY);
    current = {...DEFAULTS};
    generated = false;

    renderSliders();
    showResults(current);
    renderProfiles();
    loadHudPositions();

    notify("Application data reset.");
});

// INITIALIZE
function initialize() {
    const data = readData();

    current = {...DEFAULTS, ...(data.settings || {})};

    renderSliders();
    showResults(current);
    renderProfiles();
    loadHudPositions();
    enableHudDragging();

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
}

initialize();
// PWA INSTALLATION SYSTEM

let deferredInstallPrompt = null;

const installButton = $("installBtn");
const installMessage = $("installMessage");

function isAppInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
}

if (isAppInstalled()) {
    installButton.textContent = "✓ APP INSTALLED";
    installButton.disabled = true;
    installMessage.textContent = "Emmy Pro X is already installed!";
}

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
});

installButton.addEventListener("click", async () => {
    if (isAppInstalled()) {
        notify("Emmy Pro X is already installed!");
        return;
    }

    if (!deferredInstallPrompt) {
        installMessage.textContent =
            "Open your browser menu and choose Install app or Add to Home screen.";
        notify("Use your browser menu to install the app.");
        return;
    }

    deferredInstallPrompt.prompt();

    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === "accepted") {
        installMessage.textContent = "Thanks for installing Emmy Pro X!";
    } else {
        installMessage.textContent = "Installation was cancelled.";
    }

    deferredInstallPrompt = null;
});

window.addEventListener("appinstalled", () => {
    installButton.textContent = "✓ APP INSTALLED";
    installButton.disabled = true;
    installMessage.textContent = "Welcome to Emmy Pro X!";
    notify("Installation successful!");
});
