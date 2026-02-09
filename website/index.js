import init, * as wasm from "./wasm.js"

const WIDTH = 64
const HEIGHT = 32
const SCALE = 15
const TICKS_PER_FRAME = 10
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

gameSelect.addEventListener("change", () => {
    const value = gameSelect.value
    descriptionBox.textContent =
        descriptions[value] || "Select a game to see instructions."
})

// Mobile keyboard mapping (CHIP-8 hex keys to keyboard keys)
const keyMap = {
    '1': '1', '2': '2', '3': '3', 'c': '4',
    '4': 'q', '5': 'w', '6': 'e', 'd': 'r',
    '7': 'a', '8': 's', '9': 'd', 'e': 'f',
    'a': 'y', '0': 'x', 'b': 'c', 'f': 'v'
}

// Mobile touch keyboard - NO KEY MAPPING NEEDED, use keys directly
async function run() {
    await init()
    let chip8 = new wasm.EmuWasm()

    // Desktop keyboard events
    document.addEventListener("keydown", function(evt) {
        chip8.keypress(evt, true)
    })

    document.addEventListener("keyup", function(evt) {
        chip8.keypress(evt, false)
    })

    // Mobile touch keyboard
    const mobileKeyboard = document.getElementById("mobile-keyboard")
    const keyButtons = mobileKeyboard.querySelectorAll(".key-btn")

    keyButtons.forEach(button => {
        const key = button.dataset.key

        // Prevent default to stop any unwanted behavior
        const handlePress = (evt) => {
            evt.preventDefault()
            button.classList.add("pressed")
            const fakeEvent = new KeyboardEvent("keydown", { key: key })
            chip8.keypress(fakeEvent, true)
        }

        const handleRelease = (evt) => {
            evt.preventDefault()
            button.classList.remove("pressed")
            const fakeEvent = new KeyboardEvent("keyup", { key: key })
            chip8.keypress(fakeEvent, false)
        }

        // Touch events
        button.addEventListener("touchstart", handlePress, { passive: false })
        button.addEventListener("touchend", handleRelease, { passive: false })
        button.addEventListener("touchcancel", handleRelease, { passive: false })

        // Mouse events (for desktop testing)
        button.addEventListener("mousedown", handlePress)
        button.addEventListener("mouseup", handleRelease)

        // Handle mouse leaving button while pressed
        button.addEventListener("mouseleave", (evt) => {
            if (button.classList.contains("pressed")) {
                handleRelease(evt)
            }
        })
    })

    // Handle dropdown selection
    gameSelect.addEventListener("change", async function(evt) {
        if (!evt.target.value) return

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
        // Stop previous game
        if (anim_frame != 0) {
            window.cancelAnimationFrame(anim_frame)
        }

        let file = evt.target.files[0]
        if (!file) {
            alert("Failed to read file")
            return
        }

        // Reset the dropdown
        gameSelect.value = ""

        let fr = new FileReader()
        fr.onload = function(e) {
            let buffer = fr.result
            const rom = new Uint8Array(buffer)
            chip8.reset()
            chip8.load_game(rom)
            mainloop(chip8)
        }
        fr.readAsArrayBuffer(file)
    }, false)
}


function mainloop(chip8) {
    for (let i = 0; i < TICKS_PER_FRAME; i++) {
        chip8.tick()
    }
    chip8.tick_timers()

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

    ctx.fillStyle = "white"
    chip8.draw_screen(SCALE)

    anim_frame = window.requestAnimationFrame(() => {
        mainloop(chip8)
    })
}

run().catch(console.error)
