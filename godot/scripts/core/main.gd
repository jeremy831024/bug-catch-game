extends Node3D

const PlayerController := preload("res://scripts/player/player_controller.gd")
const FollowCamera := preload("res://scripts/player/follow_camera.gd")
const WorldGenerator := preload("res://scripts/world/world_generator.gd")
const PrototypeHud := preload("res://scripts/ui/prototype_hud.gd")


func _ready() -> void:
	randomize()
	GameState.reset_run()
	_setup_lighting()
	var player := _create_player()
	_create_camera(player)
	_create_world(player)
	_create_hud()


func _setup_lighting() -> void:
	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.63, 0.78, 0.94)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.62, 0.76, 0.92)
	env.ambient_light_energy = 0.55
	environment.environment = env
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.light_color = Color(1.0, 0.92, 0.74)
	sun.light_energy = 1.1
	sun.rotation_degrees = Vector3(-48.0, -35.0, 0.0)
	add_child(sun)


func _create_player() -> CharacterBody3D:
	var player := CharacterBody3D.new()
	player.name = "Player - Preset Explorer Placeholder"
	player.set_script(PlayerController)
	add_child(player)
	player.global_position = Vector3(0.0, 1.0, 0.0)
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.height = 2.0
	shape.radius = 0.42
	collision.shape = shape
	player.add_child(collision)
	var mesh := MeshInstance3D.new()
	var capsule := CapsuleMesh.new()
	capsule.height = 2.0
	capsule.radius = 0.42
	mesh.mesh = capsule
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.95, 0.62, 0.22)
	mesh.material_override = material
	player.add_child(mesh)
	var head_light := OmniLight3D.new()
	head_light.name = "Player Head Glow"
	head_light.position = Vector3(0.0, 1.7, 0.0)
	head_light.light_color = Color(1.0, 0.88, 0.62)
	head_light.omni_range = 8.0
	head_light.light_energy = 1.2
	player.add_child(head_light)
	return player


func _create_camera(player: CharacterBody3D) -> void:
	var pivot := Node3D.new()
	pivot.name = "Third Person Camera Pivot"
	pivot.set_script(FollowCamera)
	add_child(pivot)
	pivot.target = player
	var camera := Camera3D.new()
	camera.name = "Camera3D"
	camera.current = true
	camera.fov = 58.0
	pivot.add_child(camera)
	camera.position = Vector3.ZERO
	player.camera_pivot = pivot


func _create_world(player: CharacterBody3D) -> void:
	var world := Node3D.new()
	world.name = "Generated World"
	world.set_script(WorldGenerator)
	add_child(world)
	world.generate(player)


func _create_hud() -> void:
	var hud := Control.new()
	hud.name = "HUD"
	hud.set_anchors_preset(Control.PRESET_FULL_RECT)
	var panel := PanelContainer.new()
	panel.name = "PanelContainer"
	panel.position = Vector2(18, 18)
	panel.custom_minimum_size = Vector2(360, 120)
	hud.add_child(panel)
	var vbox := VBoxContainer.new()
	vbox.name = "VBoxContainer"
	vbox.add_theme_constant_override("separation", 4)
	panel.add_child(vbox)
	var stamina_label := Label.new()
	stamina_label.name = "StaminaLabel"
	stamina_label.unique_name_in_owner = true
	vbox.add_child(stamina_label)
	var stamina_bar := ProgressBar.new()
	stamina_bar.name = "StaminaBar"
	stamina_bar.unique_name_in_owner = true
	vbox.add_child(stamina_bar)
	var score_label := Label.new()
	score_label.name = "ScoreLabel"
	score_label.unique_name_in_owner = true
	vbox.add_child(score_label)
	var best_label := Label.new()
	best_label.name = "BestLabel"
	best_label.unique_name_in_owner = true
	vbox.add_child(best_label)
	var message_label := Label.new()
	message_label.name = "MessageLabel"
	message_label.unique_name_in_owner = true
	message_label.position = Vector2(18, 660)
	message_label.size = Vector2(900, 48)
	hud.add_child(message_label)
	var game_over_label := Label.new()
	game_over_label.name = "GameOverLabel"
	game_over_label.unique_name_in_owner = true
	game_over_label.text = "体力耗尽\n本局结束"
	game_over_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	game_over_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	game_over_label.position = Vector2(460, 280)
	game_over_label.size = Vector2(360, 140)
	game_over_label.visible = false
	hud.add_child(game_over_label)
	hud.set_script(PrototypeHud)
	add_child(hud)
