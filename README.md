<div align="center">
  <img src="https://raw.githubusercontent.com/spicetify/spicetify-cli/master/assets/icon.png" width="100" />
  <h1>🔥 Ember</h1>
  
  A completely reimagined [Spicetify](https://github.com/spicetify/spicetify-cli) theme for Spotify featuring a **top-mounted player** and a custom **animated dragon seekbar**.

  [![Spicetify](https://img.shields.io/badge/Spicetify-Compatible-FF3D00?style=for-the-badge&logo=spotify&logoColor=white)](https://spicetify.app)
  [![License](https://img.shields.io/badge/License-MIT-CC2000?style=for-the-badge)](LICENSE)
  [![Version](https://img.shields.io/badge/Version-2.0.0-FF5722?style=for-the-badge)](https://github.com/Expir3d/spotify-ember-theme)

  **Consider starring us and suggesting new features!**
</div>

---

## 📸 First Look

<p align="center">
  <img src="assets/preview1.png" width="49%">
  <img src="assets/preview2.png" width="49%">
</p>

---

## ⚡ Features

Unlike standard themes that only change colors, Ember physically restructures your Spotify layout:

- 🔝 **Top-Mounted Player**: The playback bar is moved to the very top, acting as a sleek, draggable window header.
- 🐉 **Animated Dragon Seekbar**: A custom, audio-reactive canvas seekbar that features an undulating fire dragon tail and glowing embers (particles).
- 🖤 **True AMOLED Black**: `#080808` main backgrounds save energy on OLED screens and provide insane contrast.
- 🔥 **Burnt Orange Accents**: Stunning `#FF3D00` accents across all buttons, tabs, and scrollbars.
- 🃏 **Interactive Hover States**: Smooth `scale(1.03)` card lifts and beautiful drop-shadows on interactive elements.

---

## 🛠️ Dependencies

- Latest version of [Spicetify CLI](https://spicetify.app/docs/getting-started).
- Latest version of the [Spotify Desktop Client](https://www.spotify.com/download).

---

## 📥 Installation

### 🛍️ Spicetify Marketplace (Recommended)
Simply install the [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace). Once installed, open the Marketplace tab in Spotify, search for `Ember`, and click the install button!

### 💻 Manual Installation

<details>
  <summary>Click here for step-by-step manual installation instructions</summary>
  
  1. Find your Spicetify Themes folder by running this in your terminal:
     ```bash
     spicetify path userdata
     ```
  2. Navigate to the `Themes` folder inside that directory and create a new folder named `Ember`.
  3. Clone or download this repository, and copy all files (`color.ini`, `user.css`, `theme.js`, `manifest.json`) into the `Ember` folder.
  4. Apply the theme using the Spicetify CLI:
     ```bash
     spicetify config current_theme Ember
     spicetify config color_scheme Base
     spicetify config inject_theme_js 1
     spicetify apply
     ```
     *(Note: `inject_theme_js 1` is strictly required for the Animated Dragon Seekbar to work!)*
</details>

---

## 🎨 Customization

Ember uses standard CSS variables. You can easily modify the base colors by editing the `color.ini` file in the theme directory.

```ini
[Base]
main               = 080808
sidebar            = 0C0C0C
player             = 0F0F0F
button             = FF3D00
```
*After saving changes, simply run `spicetify apply` again.*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Expir3d/spotify-ember-theme/issues).

---

<div align="center">
  <p>Made with 🔥 for music that burns</p>
  <p>&copy; 2024 Ember Theme</p>
</div>
