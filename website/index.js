
import init, * as wasm from "./wasm.js"

const WIDTH = 64
const HEIGHT = 32
const SCALE = 15
const TICKS_PER_FRAME = 9
let anim_frame = 0

const canvas = document.getElementById("canvas")
canvas.width = WIDTH * SCALE
canvas.height = HEIGHT * SCALE

const ctx = canvas.getContext("2d")
ctx.fillStyle = "black"
ctx.fillRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

const fileInput = document.getElementById("fileinput")
const gameSelect = document.getElementById("gameselect")
const descriptionBox = document.getElementById("gamedescription")

// ===== SOUND CLASS =====
class Chip8Sound {
    constructor() {
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.enabled = true;
    }

    async init() { // Added async
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
                this.gainNode.gain.value = 0.1;
            } catch (e) {
                console.error("Failed to initialize audio:", e);
                this.enabled = false;
                return;
            }
        }

        // Every time init is called via an interaction, try to resume
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    play() {
        if (!this.enabled) return;
        if (!this.audioContext) this.init();
        if (!this.audioContext) return;

        if (!this.isPlaying) {
            try {
                this.oscillator = this.audioContext.createOscillator();
                this.oscillator.type = 'square';
                this.oscillator.frequency.value = 440;
                this.oscillator.connect(this.gainNode);
                this.oscillator.start();
                this.isPlaying = true;
            } catch (e) {
                console.error("Failed to play sound:", e);
            }
        }
    }

    stop() {
        if (this.isPlaying && this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {
                // Oscillator already stopped
            }
            this.oscillator = null;
            this.isPlaying = false;
        }
    }

    update(soundTimer) {
        if (soundTimer > 0 && this.enabled) {
            this.play();
        } else {
            this.stop();
        }
    }
}

// Initialize sound
const sound = new Chip8Sound()
let soundEnabled = true
let audioInitialized = false

const descriptions = {
    "c8games/15PUZZLE": `15 Puzzle:
Organize the letters in the CHIP-8 keyboard layout.

Original CHIP-8 Keyboard:
1 2 3 C
4 5 6 D
7 8 9 E
A 0 B F`,

    "c8games/BRIX": `Brix:
Q and E to move.
Keep the ball bouncing to destroy all tiles.`,

    "c8games/INVADERS": `Space Invaders:
A to start
Q and E to move
W to shoot
Destroy all enemies before time runs out.`,

    "c8games/MERLIN": `Merlin:
Q = top left
W = top right
A = bottom left
S = bottom right

Remember the pattern and repeat it.
Patterns get longer over time.`,

    "c8games/MISSILE": `Missile:
S to shoot.
Shoot when you are under the target.
Speed increases over time.`,

    "c8games/PONG2": `Pong:
Player 1 → 1 up, Q down
Player 2 → 4 up, R down

Classic ping pong.`,

    "c8games/TETRIS": `Tetris:
Q rotate
W move left
E move right
A fall faster`,

    "c8games/TICTAC": `Tic Tac Toe:

1 2 3
Q W E
A S D

1 = top left
D = bottom right`,

    "c8games/UFO": `UFO:
Q launch left
W launch up
E launch right

Reach space without getting hit.`,

    "c8games/VBRIX": `VBrix:
A start
1 up
Q down

Keep the ball bouncing and destroy all tiles.`,

    "c8games/VERS": `Vers (2 Player Snake):

Player 1:
1 down
2 up
A left
Y/Z right

Player 2:
4 right
R left
C up
V down`,

    "c8games/RPS.ch8": `Rock Paper Scissors:
Keybinds are explained inside the game.
(German keyboard: Z is the Y key)`
}

gameSelect.addEventListener("change", async function(evt) {
    if (!evt.target.value) return;

    // Call this IMMEDIATELY before any 'await' calls
    initAudio();

    if (anim_frame != 0) {
        window.cancelAnimationFrame(anim_frame);
    }

    // ... rest of your fetch logic
});

// Initialize audio on first user interaction
function initAudio() {
    if (soundEnabled) {
        sound.init();
        audioInitialized = true;

        // Create and play a tiny buffer of silence to "unlock" the audio hardware
        if (sound.audioContext && !audioInitialized) {
            const buffer = sound.audioContext.createBuffer(1, 1, 22050);
            const source = sound.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(sound.audioContext.destination);
            source.start(0);
            audioInitialized = true;
        }
    }
}

// Mobile touch keyboard
async function run() {
    await init()
    let chip8 = new wasm.EmuWasm()

    // Desktop keyboard events
    document.addEventListener("keydown", function(evt) {
        initAudio()
        chip8.keypress(evt, true)
    })

    document.addEventListener("keyup", function(evt) {
        chip8.keypress(evt, false)
    })

    document.addEventListener('touchstart', function() {
        initAudio();
    }, { once: true });

    // Mobile touch keyboard logic
    const keyButtons = document.querySelectorAll(".key-btn");

    keyButtons.forEach(button => {
        const key = button.dataset.key;

        const handlePress = (evt) => {
            evt.preventDefault();
            initAudio()
            button.classList.add("pressed");
            const fakeEvent = new KeyboardEvent("keydown", { key: key });
            chip8.keypress(fakeEvent, true);
        };

        const handleRelease = (evt) => {
            evt.preventDefault();
            button.classList.remove("pressed");
            const fakeEvent = new KeyboardEvent("keyup", { key: key });
            chip8.keypress(fakeEvent, false);
        };

        // Touch Events for Mobile
        button.addEventListener("touchstart", handlePress, { passive: false });
        button.addEventListener("touchend", handleRelease, { passive: false });
        button.addEventListener("touchcancel", handleRelease, { passive: false });

        // Mouse Events for Desktop Testing
        button.addEventListener("mousedown", handlePress);
        button.addEventListener("mouseup", handleRelease);
        button.addEventListener("mouseleave", handleRelease);
    });

    // Sound toggle (optional - only if you add the checkbox)
    const soundToggle = document.getElementById("sound-toggle")
    if (soundToggle) {
        soundToggle.addEventListener("change", (evt) => {
            soundEnabled = evt.target.checked
            sound.setEnabled(soundEnabled)
            // FIX #1: Initialize audio on toggle interaction (helps mobile)
            if (soundEnabled) {
                initAudio()
            }
        })
    }

    // Handle dropdown selection
    gameSelect.addEventListener("change", async function(evt) {
        if (!evt.target.value) return

        initAudio()

        // Stop previous game
        if (anim_frame != 0) {
            window.cancelAnimationFrame(anim_frame)
        }

        try {
            const response = await fetch(evt.target.value)
            if (!response.ok) {
                alert("Failed to load game")
                return
            }
            const buffer = await response.arrayBuffer()
            const rom = new Uint8Array(buffer)
            chip8.reset()
            chip8.load_game(rom)
            mainloop(chip8)
        } catch (error) {
            console.error("Error loading game:", error)
            alert("Failed to load game: " + error.message)
        }
    })

    // Handle file upload
    fileInput.addEventListener("change", function(evt) {
        initAudio()

        // Stop previous game
        if (anim_frame != 0) {
            window.cancelAnimationFrame(anim_frame)
        }

        let file = evt.target.files[0]
        if (!file) {
            alert("Failed to read file")
            return
        }

        // FIX #2: Validate file extension to prevent Rust aliasing error
        const fileName = file.name.toLowerCase()
        if (!fileName.endsWith('.ch8') && !fileName.endsWith('.c8')) {
            alert("Invalid file type. Please upload a .ch8 or .c8 file.")
            fileInput.value = '' // Clear input to prevent state pollution
            return
        }

        descriptionBox.textContent = "No description available for uploaded files."

        // Reset the dropdown
        gameSelect.value = ""

        let fr = new FileReader()
        fr.onload = function(e) {
            let buffer = fr.result
            const rom = new Uint8Array(buffer)
            chip8.reset()
            chip8.load_game(rom)
            mainloop(chip8)
            // FIX #2: Clear file input after successful load
            fileInput.value = ''
        }
        fr.readAsArrayBuffer(file)
    }, false)
}


function mainloop(chip8) {
    for (let i = 0; i < TICKS_PER_FRAME; i++) {
        chip8.tick()
    }
    chip8.tick_timers()

    // Update sound based on sound timer
    const soundTimer = chip8.get_sound_timer()
    sound.update(soundTimer)

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

    ctx.fillStyle = "white"
    chip8.draw_screen(SCALE)

    updateDebugger(chip8)

    anim_frame = window.requestAnimationFrame(() => {
        mainloop(chip8)
    })
}

const regContainer = document.getElementById("dbg-registers");

for (let i = 0; i < 16; i++) {
    const div = document.createElement("div");
    div.innerHTML = `V${i.toString(16).toUpperCase()}:
 <span id="reg${i}">00</span>`;
    regContainer.appendChild(div);
}

function updateDebugger(chip8) {
    document.getElementById("dbg-pc").textContent =
        chip8.dbg_pc().toString(16).padStart(3, "0");

    document.getElementById("dbg-i").textContent =
        chip8.dbg_i().toString(16).padStart(3, "0");

    document.getElementById("dbg-sp").textContent =
        chip8.dbg_sp();

    const regs = chip8.dbg_registers();
    regs.forEach((val, i) => {
        document.getElementById(`reg${i}`).textContent =
            val.toString(16).padStart(2, "0");
    });

    document.getElementById("dbg-stack").innerHTML =
        chip8.dbg_stack().map(v => v.toString(16)).join("<br>");
}


run().catch(console.error)
