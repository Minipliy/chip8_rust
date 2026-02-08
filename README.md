# CHIP-8 Emulator

A CHIP-8 emulator written in Rust with multiple frontends: desktop application using SDL2 and web version with WebAssembly for browser-based gameplay.

## Features

- Full CHIP-8 instruction set implementation
- Desktop frontend with SDL2
- Web frontend with WebAssembly (coming soon)
- Keyboard input support
- Play classic CHIP-8 games

## Building and Running

### Prerequisites

- Rust (latest stable version)
- SDL2 library
- wasm-pack (for web version)

#### Installing SDL2

**macOS:**
```bash
brew install sdl2
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install libsdl2-dev
```

**Windows:**
Follow the [SDL2 installation guide](https://github.com/Rust-SDL2/rust-sdl2#windows-msvc)

#### Installing wasm-pack
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### Desktop Version
```bash
# Clone the repository
git clone https://github.com/yourusername/chip8_rust.git
cd chip8_rust/desktop

# Run with a ROM file
cargo run --release path/to/rom
```

### Web Version

```bash
# Build the WebAssembly package
cd chip8_rust/wasm
wasm-pack build --target web

# Serve the web version locally
cd ../website
python3 -m http.server 8000

# Open your browser to http://localhost:8000
```

## Controls

The CHIP-8 uses a 16-key hexadecimal keypad. This emulator maps them to your keyboard (QWERTZ layout only):
```
Keyboard                    CHIP-8
+---+---+---+---+           +---+---+---+---+
| 1 | 2 | 3 | 4 |           | 1 | 2 | 3 | C |
+---+---+---+---+           +---+---+---+---+
| Q | W | E | R |           | 4 | 5 | 6 | D |
+---+---+---+---+     =>    +---+---+---+---+
| A | S | D | F |           | 7 | 8 | 9 | E |
+---+---+---+---+           +---+---+---+---+
| Y | X | C | V |           | A | 0 | B | F |
+---+---+---+---+           +---+---+---+---+
```

**ESC** - Exit emulator (desktop)

## Finding ROMs

You can find public domain CHIP-8 ROMs here:
- [CHIP-8 Games Pack](https://www.zophar.net/pdroms/chip8/chip-8-games-pack.html)

## Technical Details

### CHIP-8 Specifications

- **CPU:** 16 8-bit registers (V0-VF)
- **Memory:** 4KB RAM
- **Display:** 64x32 monochrome
- **Stack:** 16 levels
- **Timers:** 60Hz delay and sound timers
- **Input:** 16-key hexadecimal keypad

### Implementation

The emulator consists of:
- **`chip8_core`**: Platform-agnostic interpreter implementing the full CHIP-8 instruction set
- **`desktop`**: SDL2-based frontend for native desktop execution
- **`web`**: WebAssembly frontend for browser-based play

## Roadmap

- [x] Core CHIP-8 interpreter
- [x] Desktop frontend with SDL2
- [x] Keyboard input
- [x] Display rendering
- [x] WebAssembly web frontend
- [ ] Update web version website
- [ ] Sound support

## Resources

- [Cowgod's CHIP-8 Technical Reference](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM)
- [CHIP-8 Wikipedia](https://en.wikipedia.org/wiki/CHIP-8)

## License

MIT License - feel free to use this project for learning and development.

## Credits

This project was built following the CHIP-8 tutorial by [aquova](https://github.com/aquova/chip8-book).
The original tutorial code is licensed under CC0 1.0 Universal.

---

Made with Love and Rust
