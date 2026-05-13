class_name EquipmentCatalog
extends RefCounted

static func initial_equipment() -> Array[Dictionary]:
	return [
		{
			"id": "straw_hat",
			"display_name": "草帽",
			"slot": "head",
			"stamina_bonus": 8.0,
			"move_speed_bonus": 0.0,
			"poison_resistance": 0.0,
			"gameplay_note": "默认探索装备"
		},
		{
			"id": "rain_boots",
			"display_name": "雨靴",
			"slot": "shoes",
			"stamina_bonus": 0.0,
			"move_speed_bonus": -0.2,
			"poison_resistance": 0.15,
			"gameplay_note": "适合沼泽和雨天"
		},
		{
			"id": "bug_net",
			"display_name": "捕虫网",
			"slot": "tool",
			"stamina_bonus": 0.0,
			"move_speed_bonus": 0.0,
			"poison_resistance": 0.0,
			"gameplay_note": "第一版默认捕捉工具"
		}
	]
