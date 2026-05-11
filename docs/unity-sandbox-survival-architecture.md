# 抓虫大冒险 Unity 沙盒生存技术设计

## 1. 技术选型

- 引擎：Unity LTS
- 语言：C#
- 渲染管线：URP
- 摄像机：Cinemachine
- 输入：New Input System
- UI：Unity UI Toolkit 或 UGUI
- 资源管理：Prefab + ScriptableObject + Addressables
- 存档：本地存档起步，后续接云端

## 2. 架构原则

- 模型、贴图、动画、碰撞、音效、玩法逻辑分层解耦
- 预设角色、昆虫、道具、地形都用数据驱动
- 先用视觉占位符和基础几何体验证玩法，再逐步替换资源
- 捕捉、移动、生存、任务、生成、AI 彼此独立

## 3. 目录建议

```text
Assets/
  Game/
    Scenes/
    Scripts/
      Core/
      Gameplay/
      Systems/
      UI/
      Data/
      AI/
    Prefabs/
      Player/
      Insects/
      Props/
      Biomes/
    Art/
      Models/
      Textures/
      Animations/
      VFX/
    Audio/
    ScriptableObjects/
```

## 4. 运行时模块

### 4.1 Game Bootstrap

- 初始化配置
- 加载主菜单或游戏场景
- 读取存档
- 初始化随机种子

### 4.2 World Generator

- 生成地图区块
- 布置草地、沼泽、洞穴、山地、湖泊
- 派生树木、虫子、障碍、食物、道具

### 4.3 Player System

- 第三人称移动
- 体力消耗
- 速度升级
- 背包管理
- 受击、中毒、加速、隐身等状态

### 4.4 Insect System

- 不同虫子使用独立行为配置
- 逃跑型、攻击型、伪装型、飞行型、夜行型
- 图鉴解锁和捕获记录

### 4.5 Survival System

- 体力持续消耗
- 食物恢复
- 解毒药减伤
- 安全区休息恢复
- 体力归零结束游戏

### 4.6 Hazard System

- 蜘蛛网减速
- 毒蘑菇中毒
- 捕食者追击
- 泥坑、断崖、湖泊阻挡

### 4.7 Time Weather System

- 昼夜循环
- 夜晚视野缩小
- 雨天摩擦降低、惯性增强
- 雾天视野受限

### 4.8 UI System

- 首页
- 预设角色选择
- HUD
- 图鉴
- 排行榜
- 任务面板

## 5. 资源解耦策略

### 5.1 角色

- 预设角色先用占位符模型
- 角色逻辑和外观分离
- 后续可替换模型、贴图、动画，不改玩法脚本

### 5.2 昆虫

- 每种虫子对应一个数据配置
- 视觉占位符、正式模型、动画剪辑分离
- 状态机不依赖具体模型

### 5.3 地形

- 地形块用数据驱动
- 地面材质、碰撞和生物群落分开
- 区块可逐步替换成更精细美术

### 5.4 道具

- 道具图标、3D 模型、功能逻辑分离
- 食物、解毒药、手电、陷阱工具都通过 ScriptableObject 配置

## 6. 摄像机与灯光

### 6.1 摄像机

- 第三人称跟随
- 角色位于画面后下方
- 支持平滑跟随
- 可在夜晚或抓虫时轻微拉近

### 6.2 光照

- 主光源：太阳光 Directional Light
- 环境光：淡蓝色 Hemisphere Light
- 玩家头顶：跟随泛光灯，提升暗处可见度

## 7. 物理与碰撞

- 玩家使用 CharacterController 或 Rigidbody 方案二选一
- 湖泊、断崖、树干、山体使用碰撞体
- 蜘蛛网、毒蘑菇、安全区、道具使用 Trigger
- 地形滑动、雨天惯性、减速区域用物理参数或速度修正实现

## 8. 状态系统

### 8.1 玩家状态

- Normal
- Running
- Fatigued
- Poisoned
- Slowed
- Invisible
- Resting
- GameOver

### 8.2 昆虫状态

- Idle
- Fleeing
- Hiding
- Perched
- Flying
- Aggro
- Trapped
- Captured

### 8.3 道具状态

- Equipped
- InBackpack
- Consumed
- Cooldown

## 9. 数据驱动方案

建议使用 ScriptableObject 管理：

- 昆虫配置
- 预设角色配置
- 道具配置
- 地形配置
- 天气配置
- 任务配置

示例字段：

```csharp
[CreateAssetMenu]
public class InsectConfig : ScriptableObject {
  public string id;
  public string displayName;
  public int scoreValue;
  public float speed;
  public float spawnWeight;
  public GameObject placeholderPrefab;
  public GameObject finalPrefab;
  public AnimationClip idleClip;
  public AnimationClip fleeClip;
}
```

## 10. 玩法与系统边界

- MovementSystem 只负责移动和速度修正
- CaptureSystem 只负责抓捕判定和反馈
- SurvivalSystem 只负责体力、恢复和死亡
- WeatherSystem 只负责环境状态和参数影响
- AI 只负责虫子、捕食者和威胁逻辑
- UI 不直接操控底层对象，只订阅状态变化

## 11. 资源替换流程

第一阶段：

- 几何体占位符
- 基础材质
- 简单动画或无动画

第二阶段：

- 替换为低多边形模型
- 替换贴图
- 接入骨骼动画

第三阶段：

- 加入更精细特效
- 增加更丰富动画状态
- 优化加载与过场

## 12. 性能建议

- 地图按区块加载
- 远处对象 LOD
- 使用对象池管理虫子、食物、粒子和掉落物
- 限制同时活跃的敌对单位数量
- 夜晚和天气特效控制在轻量级

## 13. 迭代路线

### Phase 1

- Unity 场景、第三人称摄像机、基础移动、碰撞
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

