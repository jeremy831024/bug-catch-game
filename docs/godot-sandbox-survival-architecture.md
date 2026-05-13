# 抓虫大冒险 Godot 沙盒生存技术设计

## 1. 技术选型

- 引擎：Godot 4.6.x
- 语言：GDScript
- 渲染：Forward+ 起步，必要时切 Mobile renderer 优化低配设备
- 物理：Godot Physics 3D
- 输入：Godot InputMap
- UI：Control / Container / Theme
- 数据：Dictionary 原型起步，后续迁移为 Resource `.tres`
- 场景：`.tscn` + PackedScene
- 存档：`ConfigFile` 本地存档起步，后续可接云端

## 2. 架构原则

- 模型、贴图、动画、碰撞、音效、玩法逻辑分层解耦
- 预设角色、昆虫、道具、地形都用数据驱动
- 先用视觉占位符和基础几何体验证玩法，再逐步替换资源
- 捕捉、移动、生存、任务、生成、AI 彼此独立
- 业务状态通过 Autoload `GameState` 统一广播，UI 订阅信号

## 3. 目录建议

```text
godot/
  project.godot
  scenes/
    main.tscn
    player/
    insects/
    props/
    ui/
  scripts/
    core/
    data/
    player/
    world/
    insects/
    ui/
  resources/
    insects/
    equipment/
    biomes/
    items/
  art/
    models/
    textures/
    animations/
    vfx/
  audio/
```

## 4. 运行时模块

### 4.1 Main Scene

- 初始化随机种子
- 创建或加载世界
- 创建玩家、摄像机、HUD
- 连接全局状态和运行时系统

### 4.2 World Generator

- 生成地图区块
- 布置草地、沼泽、洞穴、山地、湖泊
- 派生树木、虫子、障碍、食物、道具
- 第一版使用代码生成，第二版迁移为区块场景和 PackedScene

### 4.3 Player System

- 第三人称移动：`CharacterBody3D`
- 体力消耗
- 速度升级
- 背包管理
- 受击、中毒、加速、隐身等状态
- 装备槽位、属性修正、外观附着和耐久管理

### 4.4 Equipment System

- 装备槽位管理
- 装备属性修正
- 装备耐久、升级、修复
- 装备与角色外观挂接
- 装备栏和道具背包分离

### 4.5 Insect System

- 昆虫使用独立数据配置
- 逃跑型、攻击型、伪装型、飞行型、夜行型
- 图鉴解锁和捕获记录
- 每种虫子配置独立的躲藏习性、出没条件、群居倾向、声音提示和视觉定位提示
- `Area3D` 负责感知和交互，正式版可拆成状态机节点

### 4.6 Survival System

- 体力持续消耗
- 食物恢复
- 解毒药减伤
- 安全区休息恢复
- 体力归零结束游戏

### 4.7 Hazard System

- 蜘蛛网减速
- 毒蘑菇中毒
- 捕食者追击
- 泥坑、断崖、湖泊阻挡

### 4.8 Time Weather System

- 昼夜循环
- 夜晚视野缩小
- 雨天摩擦降低、惯性增强
- 雾天视野受限

### 4.9 UI System

- 首页
- 预设角色选择
- HUD
- 图鉴
- 排行榜
- 任务面板
- 装备栏与装备对比面板

## 5. 资源解耦策略

### 5.1 角色

- 预设角色先用占位符模型
- 角色逻辑和外观分离
- 后续可替换模型、贴图、动画，不改玩法脚本
- 角色外观作为子场景挂在 `CharacterBody3D` 下

### 5.2 昆虫

- 每种虫子对应一个 Resource 或 Dictionary 配置
- 视觉占位符、正式模型、动画剪辑分离
- 状态机不依赖具体模型
- 音频提示、近距离轮廓变化、草丛/树木/洞口反馈都应配置化
- 物种池、保护状态、危险状态和地区适配性独立管理，避免把“能做”误写成“能抓”
- 同一虫群可先共用低模骨架和动画，再按物种替换翅型、甲壳、颜色和音效

### 5.3 地形

- 地形块用数据驱动
- 地面材质、碰撞和生物群落分开
- 区块可逐步替换成更精细美术

### 5.4 道具

- 道具图标、3D 模型、功能逻辑分离
- 食物、解毒药、手电、陷阱工具都通过 Resource 配置
- 角色、树木、昆虫、道具和环境提示词统一维护在 [godot-sandbox-art-prompts.md](./godot-sandbox-art-prompts.md)

### 5.5 装备

- 装备外观、属性、槽位、耐久和升级分离
- 头部、上身、下身、鞋子、手部、背部、工具位、饰品位独立配置
- 装备系统规范见 [godot-equipment-system-spec.md](./godot-equipment-system-spec.md)

## 6. 摄像机与灯光

### 6.1 摄像机

- 第三人称跟随
- 角色位于画面后下方
- 支持平滑跟随
- 可在夜晚或抓虫时轻微拉近

### 6.2 光照

- 主光源：`DirectionalLight3D`
- 环境光：淡蓝色 `WorldEnvironment`
- 玩家头顶：`OmniLight3D` 跟随光源，提升暗处可见度

## 7. 物理与碰撞

- 玩家使用 `CharacterBody3D`
- 湖泊、断崖、树干、山体使用 `StaticBody3D`
- 蜘蛛网、毒蘑菇、安全区、道具使用 `Area3D`
- 地形滑动、雨天惯性、减速区域通过移动参数修正实现

## 8. 状态系统

玩家状态：

- Normal
- Running
- Fatigued
- Poisoned
- Slowed
- Invisible
- Resting
- GameOver

昆虫状态：

- Idle
- Fleeing
- Hiding
- Perched
- Flying
- Aggro
- Trapped
- Captured

道具状态：

- Equipped
- InBackpack
- Consumed
- Cooldown

## 9. 数据驱动方案

第一版用 GDScript Dictionary，第二版迁移为 Godot Resource：

```gdscript
class_name InsectConfig
extends Resource

@export var id: String
@export var display_name: String
@export var species_group: String
@export var safety_tag: String
@export var capture_mode: String
@export var region_tag: String
@export var capturable: bool
@export var score_value: int
@export var speed: float
@export var spawn_weight: float
@export var hide_habit: String
@export var social_type: String
@export var active_time: String
@export var source_note: String
@export var cue_audio: AudioStream
@export var placeholder_scene: PackedScene
@export var final_scene: PackedScene
@export var idle_animation: String
@export var flee_animation: String
```

```gdscript
class_name EquipmentConfig
extends Resource

@export var id: String
@export var display_name: String
@export var slot_type: String
@export var rarity: int
@export var durability_max: float
@export var move_speed_bonus: float
@export var stamina_bonus: float
@export var poison_resistance_bonus: float
@export var placeholder_scene: PackedScene
@export var final_scene: PackedScene
```

## 10. 玩法与系统边界

- PlayerController 只负责移动、体力和输入
- CaptureSystem 只负责抓捕判定和反馈
- SurvivalSystem 只负责体力、恢复和死亡
- WeatherSystem 只负责环境状态和参数影响
- AI 只负责虫子、捕食者和威胁逻辑
- UI 不直接操控底层对象，只订阅 `GameState` 信号

## 11. 资源替换流程

第一阶段：

- 几何体占位符
- 基础材质
- 简单动画或无动画

第二阶段：

- 替换为低多边形模型
- 替换贴图
- 接入 `AnimationPlayer` 或 `AnimationTree`

第三阶段：

- 加入更精细特效
- 增加更丰富动画状态
- 优化加载与过场

昆虫生态与感知规范见 [godot-insect-ecology-and-sensing.md](./godot-insect-ecology-and-sensing.md)。

配套的占位符和正式资源生成提示词见 [godot-sandbox-art-prompts.md](./godot-sandbox-art-prompts.md)。

## 12. 性能建议

- 地图按区块加载
- 远处对象 LOD
- 使用对象池管理虫子、食物、粒子和掉落物
- 限制同时活跃的敌对单位数量
- 夜晚和天气特效控制在轻量级

## 13. 迭代路线

玩法优先级与分期规划见 [godot-sandbox-gameplay-roadmap.md](./godot-sandbox-gameplay-roadmap.md)。

### Phase 1

- Godot 场景、第三人称摄像机、基础移动、碰撞
- 预设角色选择
- 占位符树木、昆虫、障碍
- 体力系统和抓捕系统

### Phase 2

- 随机地图区块
- 昼夜、天气
- 食物、解毒药、背包
- 图鉴和任务

### Phase 3

- 捕食者、复杂地形、稀有虫
- 安全区休息
- 成长与升级
- 排行榜和长期目标

## 14. 验收标准

- 角色能在 3D 地图中稳定移动并受碰撞约束
- 湖泊、树木、断崖、蜘蛛网等障碍生效
- 体力系统可完成一局完整生存循环
- 昼夜与天气能真实影响可视和玩法
- 资源替换不会破坏玩法逻辑
