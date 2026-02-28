# First-Person Exploratory Game Prototype

A lightweight Three.js prototype for a first-person exploratory game where the player can move around a 3D scene and interact with objects.

## Features

- First-person camera with mouse look (pointer lock)
- WASD movement + Space to jump
- Collision with world objects
- Interactable objects highlighted by crosshair focus
- `E` key interaction feedback in HUD

## Run locally

Use any static server in this folder, for example:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173> in your browser and click **Start Exploring** (or click the 3D scene) to lock the pointer.

## Controls

- **WASD**: Move
- **Mouse**: Look around
- **Space**: Jump
- **E**: Interact with nearby object
- **Esc**: Unlock pointer / pause
