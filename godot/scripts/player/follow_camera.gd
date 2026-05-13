extends Node3D

@export var target: Node3D
@export var offset := Vector3(0.0, 7.0, 8.0)
@export var follow_speed := 8.0
@export var look_height := 1.2

func _process(delta: float) -> void:
	if target == null:
		return
	var desired := target.global_position + offset
	global_position = global_position.lerp(desired, 1.0 - exp(-follow_speed * delta))
	look_at(target.global_position + Vector3.UP * look_height, Vector3.UP)
