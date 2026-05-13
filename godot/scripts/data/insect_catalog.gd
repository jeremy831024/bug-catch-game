class_name InsectCatalog
extends RefCounted

const SAFETY_CATCHABLE := "catchable"
const SAFETY_OBSERVE_ONLY := "observe_only"
const SAFETY_HAZARD := "hazard"

const CAPTURE_NET := "net_capture"
const CAPTURE_PHOTO := "photo_only"
const CAPTURE_HAZARD := "hazard_event"

const MOVEMENT_GROUND := "ground"
const MOVEMENT_HOP := "hop"
const MOVEMENT_FLY := "fly"
const MOVEMENT_TREE := "tree_perch"
const MOVEMENT_SWARM := "hazard_swarm"

static func initial_roster() -> Array[Dictionary]:
	return [
		{
			"id": "grasshopper",
			"display_name": "蚂蚱",
			"species_group": "grasshopper",
			"safety_tag": SAFETY_CATCHABLE,
			"capture_mode": CAPTURE_NET,
			"movement_type": MOVEMENT_HOP,
			"active_time": "day",
			"hide_habit": "grass",
			"social_type": "small_group",
			"audio_cue": "short grass rustle",
			"visual_cue": "grass shake and jump arc",
			"score_value": 10,
			"speed": 4.6,
			"spawn_weight": 1.4,
			"body_color": Color(0.32, 0.73, 0.28),
			"accent_color": Color(0.85, 0.95, 0.45)
		},
		{
			"id": "copper_chafer",
			"display_name": "铜绿丽金龟",
			"species_group": "beetle",
			"safety_tag": SAFETY_CATCHABLE,
			"capture_mode": CAPTURE_NET,
			"movement_type": MOVEMENT_FLY,
			"active_time": "dusk_night",
			"hide_habit": "tree",
			"social_type": "solo",
			"audio_cue": "clear wing buzz near light",
			"visual_cue": "green shell glint",
			"score_value": 35,
			"speed": 3.1,
			"spawn_weight": 0.8,
			"body_color": Color(0.1, 0.62, 0.37),
			"accent_color": Color(0.92, 0.72, 0.22)
		},
		{
			"id": "cricket",
			"display_name": "蟋蟀",
			"species_group": "cricket",
			"safety_tag": SAFETY_CATCHABLE,
			"capture_mode": CAPTURE_NET,
			"movement_type": MOVEMENT_HOP,
			"active_time": "night",
			"hide_habit": "burrow",
			"social_type": "solo",
			"audio_cue": "chirp gets louder when close",
			"visual_cue": "grass tremble near burrow",
			"score_value": 25,
			"speed": 3.8,
			"spawn_weight": 0.9,
			"body_color": Color(0.38, 0.24, 0.13),
			"accent_color": Color(0.82, 0.69, 0.42)
		},
		{
			"id": "cabbage_white",
			"display_name": "菜粉蝶",
			"species_group": "butterfly",
			"safety_tag": SAFETY_CATCHABLE,
			"capture_mode": CAPTURE_NET,
			"movement_type": MOVEMENT_FLY,
			"active_time": "day",
			"hide_habit": "flower",
			"social_type": "pair",
			"audio_cue": "soft wing flutter",
			"visual_cue": "pale wing trail",
			"score_value": 20,
			"speed": 2.8,
			"spawn_weight": 1.1,
			"body_color": Color(0.96, 0.95, 0.82),
			"accent_color": Color(0.5, 0.52, 0.6)
		},
		{
			"id": "stag_flower_beetle",
			"display_name": "鹿角花金龟",
			"species_group": "beetle",
			"safety_tag": SAFETY_OBSERVE_ONLY,
			"capture_mode": CAPTURE_PHOTO,
			"movement_type": MOVEMENT_TREE,
			"active_time": "dusk",
			"hide_habit": "tree_sap",
			"social_type": "solo",
			"audio_cue": "deep wing buzz",
			"visual_cue": "large beetle silhouette on trunk",
			"score_value": 0,
			"speed": 1.7,
			"spawn_weight": 0.25,
			"body_color": Color(0.19, 0.12, 0.08),
			"accent_color": Color(0.74, 0.46, 0.16)
		},
		{
			"id": "hornet_swarm",
			"display_name": "胡蜂群",
			"species_group": "predator",
			"safety_tag": SAFETY_HAZARD,
			"capture_mode": CAPTURE_HAZARD,
			"movement_type": MOVEMENT_SWARM,
			"active_time": "day",
			"hide_habit": "nest",
			"social_type": "swarm",
			"audio_cue": "urgent high buzz",
			"visual_cue": "danger boundary around nest",
			"score_value": 0,
			"speed": 5.5,
			"spawn_weight": 0.25,
			"body_color": Color(0.92, 0.72, 0.16),
			"accent_color": Color(0.12, 0.1, 0.08)
		}
	]
