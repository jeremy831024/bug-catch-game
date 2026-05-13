extends Control

var stamina_current := 100.0
var stamina_max := 100.0
var score := 0
var message := "WASD 移动，Shift 奔跑，E/Space 捕捉或观察"
var message_until := 3.6
var game_over := false
var stamina_label: Label
var score_label: Label
var best_label: Label
var message_label: Label
var game_over_label: Label
var stamina_bar: ProgressBar


func _ready() -> void:
	stamina_label = get_node("PanelContainer/VBoxContainer/StaminaLabel")
	stamina_bar = get_node("PanelContainer/VBoxContainer/StaminaBar")
	score_label = get_node("PanelContainer/VBoxContainer/ScoreLabel")
	best_label = get_node("PanelContainer/VBoxContainer/BestLabel")
	message_label = get_node("MessageLabel")
	game_over_label = get_node("GameOverLabel")
	GameState.stamina_changed.connect(_on_stamina_changed)
	GameState.score_changed.connect(_on_score_changed)
	GameState.insect_captured.connect(_on_insect_captured)
	GameState.insect_observed.connect(_on_insect_observed)
	GameState.hazard_encountered.connect(_on_hazard_encountered)
	GameState.game_over.connect(_on_game_over)
	_refresh()


func _process(_delta: float) -> void:
	message_label.visible = Time.get_ticks_msec() / 1000.0 < message_until or not game_over


func _on_stamina_changed(current: float, maximum: float) -> void:
	stamina_current = current
	stamina_max = maximum
	_refresh()


func _on_score_changed(next_score: int) -> void:
	score = next_score
	_refresh()


func _on_insect_captured(insect: Dictionary) -> void:
	_show_message("捕捉成功：%s +%s" % [insect.display_name, insect.score_value])


func _on_insect_observed(insect: Dictionary) -> void:
	_show_message("观察记录：%s，该物种暂不捕捉" % insect.display_name)


func _on_hazard_encountered(insect: Dictionary) -> void:
	_show_message("危险：%s，远离巢穴区域" % insect.display_name)


func _on_game_over() -> void:
	game_over = true
	game_over_label.visible = true
	_show_message("体力耗尽，本局结束。排行榜和图鉴数据已保存。")


func _show_message(next_message: String) -> void:
	message = next_message
	message_until = Time.get_ticks_msec() / 1000.0 + 3.6
	_refresh()


func _refresh() -> void:
	if not is_node_ready():
		return
	stamina_label.text = "体力：%d / %d" % [ceil(stamina_current), ceil(stamina_max)]
	score_label.text = "分数：%d" % score
	best_label.text = "最佳：%d" % GameState.get_best_score()
	message_label.text = message
	stamina_bar.max_value = stamina_max
	stamina_bar.value = stamina_current
