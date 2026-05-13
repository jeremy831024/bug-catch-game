extends CharacterBody3D

@export var move_speed := 5.2
@export var sprint_speed := 7.2
@export var stamina_max := 100.0
@export var stamina_drain_per_second := 1.1
@export var sprint_drain_per_second := 4.5
@export var capture_energy_cost := 3.0
@export var capture_radius := 2.6
@export var camera_pivot: Node3D

var stamina := 100.0
var gravity := ProjectSettings.get_setting("physics/3d/default_gravity") as float
var game_over_sent := false


func _ready() -> void:
	stamina = stamina_max
	GameState.update_stamina(stamina, stamina_max)


func _physics_process(delta: float) -> void:
	if game_over_sent:
		return
	_move(delta)
	_drain_stamina(delta)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("capture"):
		try_capture()


func recover_stamina(amount: float) -> void:
	stamina = min(stamina_max, stamina + amount)
	GameState.update_stamina(stamina, stamina_max)


func apply_hazard_damage(amount: float) -> void:
	stamina = max(0.0, stamina - amount)
	GameState.update_stamina(stamina, stamina_max)
	if stamina <= 0.0:
		_finish_game()


func try_capture() -> void:
	if stamina <= capture_energy_cost or game_over_sent:
		return
	stamina = max(0.0, stamina - capture_energy_cost)
	GameState.update_stamina(stamina, stamina_max)
	var nearest: Node = null
	var nearest_distance := INF
	for node in get_tree().get_nodes_in_group("insects"):
		if not is_instance_valid(node) or node.resolved:
			continue
		var distance := global_position.distance_to(node.global_position)
		if distance <= capture_radius and distance < nearest_distance:
			nearest = node
			nearest_distance = distance
	if nearest == null:
		return
	nearest.interact(self)


func _move(delta: float) -> void:
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := Vector3(input.x, 0.0, input.y)
	if direction.length_squared() > 0.0:
		direction = direction.normalized()
		if camera_pivot:
			var basis := camera_pivot.global_transform.basis
			var forward := -basis.z
			var right := basis.x
			forward.y = 0.0
			right.y = 0.0
			direction = (right.normalized() * input.x + forward.normalized() * -input.y).normalized()
		look_at(global_position + direction, Vector3.UP)
	var sprinting := Input.is_action_pressed("sprint") and stamina > 8.0 and direction.length_squared() > 0.0
	var speed := sprint_speed if sprinting else move_speed
	velocity.x = direction.x * speed
	velocity.z = direction.z * speed
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = -0.1
	move_and_slide()
	if sprinting:
		stamina = max(0.0, stamina - sprint_drain_per_second * delta)
		GameState.update_stamina(stamina, stamina_max)


func _drain_stamina(delta: float) -> void:
	stamina = max(0.0, stamina - stamina_drain_per_second * delta)
	GameState.update_stamina(stamina, stamina_max)
	if stamina <= 0.0:
		_finish_game()


func _finish_game() -> void:
	if game_over_sent:
		return
	game_over_sent = true
	GameState.finish_run()
