extends Area3D

const InsectCatalogScript := preload("res://scripts/data/insect_catalog.gd")

@export var awareness_radius := 7.0
@export var flee_radius := 3.2
@export var hazard_tick_seconds := 1.2

var definition: Dictionary = {}
var player: Node3D
var home := Vector3.ZERO
var wander_target := Vector3.ZERO
var next_wander_at := 0.0
var next_hazard_at := 0.0
var bob_seed := 0.0
var resolved := false
var mesh: MeshInstance3D


func setup(next_definition: Dictionary, next_player: Node3D) -> void:
	definition = next_definition
	player = next_player
	home = global_position
	wander_target = home
	bob_seed = randf() * 10.0
	add_to_group("insects")
	_build_placeholder()


func _process(delta: float) -> void:
	if definition.is_empty() or resolved:
		return
	_animate_placeholder()
	_think(delta)


func interact(player_controller: Node) -> void:
	match String(definition.safety_tag):
		InsectCatalogScript.SAFETY_CATCHABLE:
			resolved = true
			hide()
			GameState.capture_insect(definition)
		InsectCatalogScript.SAFETY_OBSERVE_ONLY:
			resolved = true
			hide()
			GameState.observe_insect(definition)
		InsectCatalogScript.SAFETY_HAZARD:
			GameState.encounter_hazard(definition)
			if player_controller.has_method("apply_hazard_damage"):
				player_controller.apply_hazard_damage(18.0)


func _think(delta: float) -> void:
	if player == null:
		return
	var to_player := player.global_position - global_position
	var distance := to_player.length()
	if String(definition.safety_tag) == InsectCatalogScript.SAFETY_HAZARD:
		_handle_hazard(delta, distance, to_player)
	elif distance < flee_radius and String(definition.capture_mode) == InsectCatalogScript.CAPTURE_NET:
		_move(-to_player.normalized(), float(definition.speed), delta)
	else:
		_wander(delta)
	_update_proximity_cue(distance)


func _handle_hazard(delta: float, distance: float, to_player: Vector3) -> void:
	if distance < awareness_radius:
		_move(to_player.normalized(), float(definition.speed) * 0.75, delta)
	else:
		_wander(delta)
	if distance < 2.4 and Time.get_ticks_msec() / 1000.0 >= next_hazard_at:
		next_hazard_at = Time.get_ticks_msec() / 1000.0 + hazard_tick_seconds
		GameState.encounter_hazard(definition)
		if player.has_method("apply_hazard_damage"):
			player.apply_hazard_damage(8.0)


func _wander(delta: float) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if now >= next_wander_at or global_position.distance_to(wander_target) < 0.6:
		next_wander_at = now + randf_range(1.2, 3.2)
		var random := Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)).normalized() * randf_range(2.0, 5.5)
		wander_target = home + Vector3(random.x, 0.0, random.y)
	var direction := wander_target - global_position
	direction.y = 0.0
	if direction.length_squared() > 0.2:
		_move(direction.normalized(), float(definition.speed) * 0.35, delta)


func _move(direction: Vector3, speed: float, delta: float) -> void:
	var planar_direction := Vector3(direction.x, 0.0, direction.z)
	if planar_direction.length_squared() <= 0.001:
		return
	planar_direction = planar_direction.normalized()
	global_position += planar_direction * speed * delta
	global_position.x = clamp(global_position.x, -28.0, 28.0)
	global_position.z = clamp(global_position.z, -28.0, 28.0)
	basis = Basis.looking_at(planar_direction, Vector3.UP)


func _animate_placeholder() -> void:
	var base_height := 1.1 if String(definition.movement_type) in [InsectCatalogScript.MOVEMENT_FLY, InsectCatalogScript.MOVEMENT_TREE] else 0.35
	global_position.y = base_height + sin(Time.get_ticks_msec() / 250.0 + bob_seed) * 0.12


func _update_proximity_cue(distance: float) -> void:
	if mesh == null:
		return
	var t: float = clamp(inverse_lerp(awareness_radius, 1.2, distance), 0.0, 1.0)
	scale = Vector3.ONE * lerp(1.0, 1.18, t)
	var material := mesh.get_surface_override_material(0) as StandardMaterial3D
	if material:
		material.albedo_color = (definition.body_color as Color).lerp(definition.accent_color as Color, t * 0.35)


func _build_placeholder() -> void:
	var collision := CollisionShape3D.new()
	var shape := SphereShape3D.new()
	shape.radius = 0.7
	collision.shape = shape
	add_child(collision)
	mesh = MeshInstance3D.new()
	if String(definition.species_group) == "butterfly":
		var box := BoxMesh.new()
		box.size = Vector3(1.0, 0.12, 0.55)
		mesh.mesh = box
	else:
		var sphere := SphereMesh.new()
		sphere.radius = 0.42
		sphere.height = 0.72
		mesh.mesh = sphere
	var material := StandardMaterial3D.new()
	material.albedo_color = definition.body_color
	mesh.set_surface_override_material(0, material)
	add_child(mesh)
