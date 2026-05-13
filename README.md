# Bug Catch Game

A bug-catching adventure game for kids aged 6-12.

Control a kid exploring the wild, catching bugs with a net and digging holes with a shovel!

## Current Development Track

The repository now has two tracks:

- `index.html` / `game.html`: original browser prototype.
- `godot/`: new Godot 4 3D sandbox survival prototype.

For the Godot version, start with:

- PRD: `docs/godot-sandbox-survival-prd.md`
- Technical design: `docs/godot-sandbox-survival-architecture.md`
- Development start guide: `docs/godot-dev-start.md`

## How to Play

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| E / Space | Use net to catch bugs |
| Q | Use shovel to dig holes |

## Bugs

| Bug | Rarity | Points | Poison |
|-----|--------|--------|--------|
| 🦗 Grasshopper | Common | 10 | No |
| 🦟 Mantis | Common | 15 | No |
| 🪲 Rhinoceros Beetle | Rare | 50 | No |
| 🦋 Butterfly | Rare | 30 | No |
| 🦗 Cicada | Common | 20 | No |
| 🕷️ Spider | Uncommon | 25 | Yes |
| 💩 Dung Beetle | Trap | -10 | Yes |

## Tech

- Pure HTML/CSS/JavaScript + Canvas
- No external dependencies
- Web browser game
