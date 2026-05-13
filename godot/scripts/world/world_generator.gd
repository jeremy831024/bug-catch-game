extends Node3D

const InsectAgentScript := preload("res://scripts/insects/insect_agent.gd")
const InsectCatalogScript := preload("res://scripts/data/insect_catalog.gd")

@export var tree_count := 18
@export var food_count := 12
@export var insect_count := 22
@export var hazard_count := 5
@export var world_size := Vector2(64.0, 64.0)

var blocked_areas: Array[AABB] = []


func generate(player: Node3D) -> void:
	_create_ground()
	_create_lake(Vector3(8.0, 0.04, 8.0), Vector3(13.0, 0.08, 9.0))
	_create_hill(Vector3(-16.0, 0.45, 11.0), Vector3(9.0, 0.9, 7.0))
	for i in range(tree_count):
		_create_tree(_find_free_position())
	for i in range(food_count):
		_create_food(_find_free_position())
	for i in range(hazard_count):
		_create_poison_patch(_find_free_position())
	for i in range(insect_count):
		_create_insect(_pick_weighted_insect(), _find_free_position(), player)


func _create_ground() -> void:
	var body := StaticBody3D.new()
	body.name = "Generated Grass Field"
	add_child(body)
	body.global_position = Vector3(0.0, -0.06, 0.0)
	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(world_size.x, 0.1, world_size.y)
	mesh.mesh = box
	mesh.material_override = _material(Color(0.35, 0.67, 0.28))
	body.add_child(mesh)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = box.size
	collision.shape = shape
	body.add_child(collision)


func _create_lake(position: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = "Lake Obstacle"
	add_child(body)
	body.global_position = position
	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	mesh.mesh = box
	mesh.material_override = _material(Color(0.16, 0.43, 0.82, 0.85))
	body.add_child(mesh)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(size.x, 1.0, size.z)
	collision.shape = shape
	body.add_child(collision)
	blocked_areas.append(AABB(position - Vector3(size.x + 2.0, 1.0, size.z + 2.0) * 0.5, Vector3(size.x + 2.0, 2.0, size.z + 2.0)))


func _create_hill(position: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = "Low Mountain Placeholder"
	add_child(body)
	body.global_position = position
	var mesh := MeshInstance3D.new()
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = 0.75
	cylinder.bottom_radius = 1.0
	cylinder.height = 1.0
	mesh.mesh = cylinder
	mesh.scale = size
	mesh.material_override = _material(Color(0.44, 0.38, 0.22))
	body.add_child(mesh)
	blocked_areas.append(AABB(position - Vector3(size.x + 1.0, 1.0, size.z + 1.0) * 0.5, Vector3(size.x + 1.0, 2.0, size.z + 1.0)))


func _create_tree(position: Vector3) -> void:
	var root := Node3D.new()
	root.name = "Cube Tree"
	add_child(root)
	root.global_position = position
	var trunk := MeshInstance3D.new()
	var trunk_mesh := BoxMesh.new()
	trunk_mesh.size = Vector3(0.65, 2.0, 0.65)
	trunk.mesh = trunk_mesh
	trunk.position = Vector3(0.0, 1.0, 0.0)
	trunk.material_override = _material(Color(0.43, 0.24, 0.12))
	root.add_child(trunk)
	var canopy := MeshInstance3D.new()
	var canopy_mesh := BoxMesh.new()
	canopy_mesh.size = Vector3(2.4, 1.8, 2.4)
	canopy.mesh = canopy_mesh
	canopy.position = Vector3(0.0, 2.5, 0.0)
	canopy.material_override = _material(Color(0.18, 0.48, 0.22))
	root.add_child(canopy)
	blocked_areas.append(AABB(position - Vector3(2.2, 0.0, 2.2) * 0.5, Vector3(2.2, 4.0, 2.2)))


func _create_food(position: Vector3) -> void:
	var area := Area3D.new()
	area.name = "Food Pickup"
	add_child(area)
	area.global_position = position + Vector3.UP * 0.45
	var collision := CollisionShape3D.new()
	var shape := SphereShape3D.new()
	shape.radius = 0.55
	collision.shape = shape
	area.add_child(collision)
	var mesh := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.35
	sphere.height = 0.7
	mesh.mesh = sphere
	mesh.material_override = _material(Color(0.95, 0.55, 0.22))
	area.add_child(mesh)
	area.body_entered.connect(func(body: Node) -> void:
		if body.has_method("recover_stamina"):
			body.recover_stamina(28.0)
			area.queue_free()
	)


func _create_poison_patch(position: Vector3) -> void:
	var area := Area3D.new()
	area.name = "Poison Mushroom Patch"
	add_child(area)
	area.global_position = position + Vector3.UP * 0.12
	var collision := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = 1.3
	shape.height = 0.3
	collision.shape = shape
	area.add_child(collision)
	var mesh := MeshInstance3D.new()
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = 1.1
	cylinder.bottom_radius = 1.2
	cylinder.height = 0.25
	mesh.mesh = cylinder
	mesh.material_override = _material(Color(0.72, 0.18, 0.72))
	area.add_child(mesh)
	area.body_entered.connect(func(body: Node) -> void:
		if body.has_method("apply_hazard_damage"):
			body.apply_hazard_damage(8.0)
	)


func _create_insect(definition: Dictionary, position: Vector3, player: Node3D) -> void:
	var insect := Area3D.new()
	insect.name = "Insect - %s" % definition.display_name
	insect.set_script(InsectAgentScript)
	add_child(insect)
	insect.global_position = position + Vector3.UP * 0.35
	insect.setup(definition, player)


func _pick_weighted_insect() -> Dictionary:
	var roster := InsectCatalogScript.initial_roster()
	var total := 0.0
	for item in roster:
		total += float(item.spawn_weight)
	var roll := randf() * total
	for item in roster:
		roll -= float(item.spawn_weight)
		if roll <= 0.0:
			return item
	return roster[0]


func _find_free_position() -> Vector3:
	for attempt in range(100):
		var position := Vector3(
			randf_range(-world_size.x * 0.45, world_size.x * 0.45),
			0.0,
			randf_range(-world_size.y * 0.45, world_size.y * 0.45)
		)
		if position.length() < 4.0 or _is_blocked(position):
			continue
		return position
	return Vector3(randf_range(-10.0, 10.0), 0.0, randf_range(-10.0, 10.0))


func _is_blocked(position: Vector3) -> bool:
	for area in blocked_areas:
		if area.has_point(position):
			return true
	return false


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	return material
