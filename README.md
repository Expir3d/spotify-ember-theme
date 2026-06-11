<div align="center">

# 🔥 Ember

### *Unleash the fire within your music*

![Spicetify](https://img.shields.io/badge/Spicetify-Compatible-FF3D00?style=flat-square&logo=spotify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-CC2000?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.0.0-FF5722?style=flat-square)

</div>

---

## Overview

**Ember** is a premium [Spicetify](https://spicetify.app) theme built for Spotify.  
It pairs a **pure AMOLED black** base with **burnt orange-red** fire accents (`#FF3D00`), creating a bold, immersive listening experience — easy on OLED screens, striking everywhere else.

### 🌟 Key Innovation: Top-Mounted Player & Dragon Seekbar
Ember completely reimagines the Spotify layout:
- **Top-Mounted Player**: The player bar has been moved from the bottom to the very top of the window, acting as a sleek, draggable header.
- **Animated Dragon Seekbar**: A custom, audio-reactive animated canvas seekbar that replaces the standard Spotify progress bar. It features an undulating fire dragon tail, interactive glowing particles, and a sleek flame arrowhead!

---

## Features

- 🖤 **True AMOLED black** — `#080808` main, `#0C0C0C` sidebar
- 🔥 **Burnt orange-red accents** — `#FF3D00` throughout: buttons, tabs, scrollbar
- 🐉 **Custom Animated Seekbar** — Floating dragon-tail waveform with live particles
- 🔝 **Top Player Bar** — Fully functional top-mounted playback controls
- 🃏 **Card hover effects** — Smooth `scale(1.03)` lift with ember shadow
- ❤️ **Fire heart icon** — Liked tracks pulse in `#FF3D00`
- 📜 **Slim ember scrollbar** — 4 px wide, full accent color
- ⚡ **Silky transitions** — Every interaction animated seamlessly

---

## Installation

### Prerequisites

- [Spotify](https://www.spotify.com/download) desktop app installed  
- [Spicetify CLI](https://spicetify.app/docs/getting-started) installed and configured

---

### Step 1 — Copy theme files

Locate your Spicetify Themes folder by running:
```bash
spicetify path userdata
```
Navigate to the `Themes` folder inside that directory, and create a new folder called **`Ember`**.

Place the following files inside `Themes/Ember/`:
- `color.ini`
- `user.css`
- `theme.js`

---

### Step 2 — Apply the theme

```bash
spicetify config current_theme Ember
spicetify config color_scheme Base
```

### Step 3 — Enable Custom JavaScript *(Required for Dragon Seekbar)*

The `theme.js` file powers the animated seekbar and the custom top-mounted controls. You must inject it:

```bash
spicetify config inject_theme_js 1
spicetify apply
```

---

## File Reference

| File | Purpose |
|------|---------|
| `color.ini` | Defines the color palette |
| `user.css` | All visual styling, top-player layout, hover effects, AMOLED backgrounds |
| `theme.js` | Animated dragon seekbar canvas, custom API event bindings, control routing |

---

## Compatibility

Tested against **Spicetify 2.x+** and latest **Spotify Desktop**.  
*AMOLED black backgrounds look best on OLED monitors and mobile mirrors.*

---

## License

MIT License

Copyright (c) 2024 Ember Theme

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

Made with 🔥 for music that burns

</div>
