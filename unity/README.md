# Bug Catch Adventure Unity Prototype

This is the Unity LTS prototype for the 3D sandbox survival version.

Open the `unity/` folder with Unity 2022.3 LTS or newer. Use the top menu item `Bug Catch/Create Prototype Scene`, open `Assets/Game/Scenes/Prototype.unity`, then press Play. The bootstrap script creates the first playable placeholder scene at runtime.

The first implementation is intentionally placeholder-driven:

- procedural grass field, lake obstacles, trees, food and hazards
- third-person player movement
- stamina drain and food recovery
- insect spawning, sensing and capture
- protected/dangerous species separation
- simple HUD, collection and leaderboard persistence

Generated Unity folders such as `Library/`, `Temp/`, `Obj/`, `Logs/` and IDE project files are ignored by Git.
