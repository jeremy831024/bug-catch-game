extends Node

signal stamina_changed(current: float, maximum: float)
signal score_changed(score: int)
signal insect_captured(insect: Dictionary)
signal insect_observed(insect: Dictionary)
signal hazard_encountered(insect: Dictionary)
signal game_over()

var score: int = 0
var survival_seconds: float = 0.0
var is_game_over: bool = false
var captured: Dictionary = {}
var observed: Dictionary = {}
var hazards: Dictionary = {}


func _process(delta: float) -> void:
	if not is_game_over:
		survival_seconds += delta


func reset_run() -> void:
	score = 0
	survival_seconds = 0.0
	is_game_over = false
	captured.clear()
	observed.clear()
	hazards.clear()
	score_changed.emit(score)


func capture_insect(insect: Dictionary) -> void:
	if is_game_over:
		return
	var insect_id := String(insect.id)
	captured[insect_id] = int(captured.get(insect_id, 0)) + 1
	score += int(insect.score_value)
	insect_captured.emit(insect)
	score_changed.emit(score)


func observe_insect(insect: Dictionary) -> void:
	if is_game_over:
		return
	observed[String(insect.id)] = true
	insect_observed.emit(insect)


func encounter_hazard(insect: Dictionary) -> void:
	if is_game_over:
		return
	hazards[String(insect.id)] = true
	hazard_encountered.emit(insect)


func update_stamina(current: float, maximum: float) -> void:
	stamina_changed.emit(current, maximum)


func finish_run() -> void:
	if is_game_over:
		return
	is_game_over = true
	var config := ConfigFile.new()
	config.load("user://save.cfg")
	var best_score := int(config.get_value("leaderboard", "best_score", 0))
	var best_survival := float(config.get_value("leaderboard", "best_survival_seconds", 0.0))
	config.set_value("leaderboard", "last_score", score)
	config.set_value("leaderboard", "last_survival_seconds", survival_seconds)
	config.set_value("leaderboard", "best_score", max(best_score, score))
	config.set_value("leaderboard", "best_survival_seconds", max(best_survival, survival_seconds))
	for insect_id in captured.keys():
		var key := "captured_%s" % insect_id
		config.set_value("collection", key, int(config.get_value("collection", key, 0)) + int(captured[insect_id]))
	for insect_id in observed.keys():
		config.set_value("collection", "observed_%s" % insect_id, true)
	for insect_id in hazards.keys():
		config.set_value("collection", "hazard_%s" % insect_id, true)
	config.save("user://save.cfg")
	game_over.emit()


func get_best_score() -> int:
	var config := ConfigFile.new()
	config.load("user://save.cfg")
	return int(config.get_value("leaderboard", "best_score", 0))
