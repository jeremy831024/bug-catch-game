# 抓虫大冒险 3D 升级设计文档

## 1. 项目目标

将当前 2D Canvas 抓虫游戏升级为现代 Web 3D 游戏。核心体验保持不变：玩家操控小探险家在野外移动、捕虫、挖洞、收集图鉴、记录成绩。升级重点是提升空间感、可读性、沉浸感和后续扩展能力。

本阶段目标不是一次性做大型 3D 游戏，而是先建立稳定的 3D 技术架构，让后续可以持续扩展昆虫 AI、地形生态、任务系统、排行榜和部署流程。

## 2. 推荐技术栈

### 2.1 前端框架

- 构建工具：Vite
- 语言：TypeScript
- 3D 渲染：Three.js
- 状态管理：Zustand 或轻量自研 store
- UI 层：React + CSS Modules 或普通 DOM HUD
- 音频：Web Audio API
- 存储：localStorage，后续可接 Supabase/Firebase
- 部署：GitHub Pages，后续可迁移 Vercel/Cloudflare Pages

### 2.2 为什么选这个栈

- Three.js 对第三人称 3D 场景、灯光、摄像机、模型、材质支持成熟。
- Vite + TypeScript 适合把当前大单文件拆成模块，提升长期维护性。
- 游戏本体仍可以保持静态部署，不需要服务端即可上线。
- React 只负责菜单、HUD、排行榜、图鉴，不参与核心游戏循环，避免 UI 和渲染耦合。

### 2.3 可选增强库

- 路径寻路：自研 Grid A*，优先推荐。地图本身是格子逻辑，没必要一开始引入复杂导航网格。
- 碰撞：先用网格阻挡 + 圆形/胶囊体碰撞，自研即可。
- 后期效果：three/examples 的 `EffectComposer`，用于轻量 Bloom、色彩校正。
- 模型动画：Three.js `AnimationMixer`，后续接 glTF 角色模型时使用。

## 3. 总体架构

```text
src/
  main.ts
  app/
    App.tsx
    routes.ts
  game/
    Game.ts
    GameLoop.ts
    GameState.ts
    constants.ts
  scene/
    SceneManager.ts
    TerrainSystem.ts
    LightingSystem.ts
    CameraController.ts
    RenderPipeline.ts
  entities/
    Player.ts
    Insect.ts
    Burrow.ts
    Tree.ts
    Lake.ts
    Mountain.ts
  systems/
    InputSystem.ts
    MovementSystem.ts
    CollisionSystem.ts
    CaptureSystem.ts
    DiggingSystem.ts
    InsectAISystem.ts
    EffectSystem.ts
    AudioSystem.ts
    StorageSystem.ts
  ui/
    HomePage.tsx
    CharacterSelect.tsx
    HUD.tsx
    Leaderboard.tsx
    Collection.tsx
  assets/
    models/
    textures/
    audio/
```

核心原则：

- Three.js 场景只负责渲染和视觉对象。
- 游戏规则放在 systems 内。
- 游戏数据放在 GameState 内。
- UI 页面不直接操作 Three.js 对象，只通过 Game API 或 store 读写状态。

## 4. 页面与流程

### 4.1 页面流程

```text
首页
  -> 开始冒险
    -> 预设角色选择
      -> 进入 3D 游戏
  -> 排行榜
  -> 昆虫图鉴
```

### 4.2 页面职责

- 首页：展示开始按钮、排行榜入口、图鉴入口、最近成绩。
- 预设角色选择：玩家进入游戏前选择一个预设形象，可输入或沿用默认名字，保存到本地。
- 3D 游戏页：挂载 Three.js canvas，显示 HUD。
- 排行榜：读取本地或云端成绩。
- 图鉴：展示昆虫资料、捕获次数、首次发现信息。

## 5. 3D 场景设计

### 5.1 世界尺寸

采用逻辑格子 + 3D 坐标映射：

- 地图尺寸：64 x 64 或 80 x 80 格
- 单格尺寸：1 world unit
- 地面为大型平面，铺棋盘格纹或绿色草地材质
- 玩家、虫子、树、湖泊、山地都挂在这个世界坐标上

```ts
type TileType = "grass" | "checker" | "lake" | "mountain" | "road";

interface Tile {
  x: number;
  z: number;
  type: TileType;
  walkable: boolean;
  speedModifier: number;
}
```

### 5.2 地面

支持两种视觉方案：

- 棋盘格纹：更清楚表达移动范围，适合调试和早期版本。
- 绿色草地：更接近最终游戏风格，适合上线版本。

实现方式：

- 基础平面：`PlaneGeometry`
- 材质：草地贴图或程序化 CanvasTexture
- 棋盘格：ShaderMaterial 或 CanvasTexture

### 5.3 湖泊

湖泊是障碍物，不可通行。

视觉：

- 蓝色半透明平面
- 轻微波纹动画
- 边缘可加湿润深色过渡

规则：

- `walkable = false`
- 玩家不能进入
- 地面昆虫不能进入
- 飞行昆虫可从上方经过，但不能停在湖面

### 5.4 山地

山地不是绝对障碍，默认作为减速区域，也可以在局部设置不可通行。

视觉：

- 低多边形隆起地形
- 棕绿混合材质
- 可用多个圆锥/变形平面模拟小丘

规则：

- `speedModifier = 0.55 ~ 0.75`
- 对玩家和地面昆虫减速
- 可作为稀有昆虫出现区域

### 5.5 树木

随机生成 15-20 个立方体树木。

基础树模型：

- 树干：棕色长方体
- 树冠：绿色立方体或多个立方体组合
- 后续可替换为 glTF 或低多边形模型

实现策略：

- 第一版先使用几何体视觉占位符，不依赖外部模型文件。
- 树冠和树干保持清晰轮廓，便于验证碰撞、遮挡和场景可读性。
- 后续替换为正式三维模型时，只替换渲染层，不修改树木的逻辑数据、碰撞体和知了停靠点。

规则：

- 树干占据格子，玩家不可穿过树干。
- 知了只能停在树上。
- 部分昆虫可围绕树活动。

```ts
interface TreeEntity {
  id: string;
  tileX: number;
  tileZ: number;
  trunkColliderRadius: number;
  perchPoints: Vector3[];
}
```

## 6. 光照设计

### 6.1 主光源：太阳光

使用 `DirectionalLight` 模拟阳光。

建议参数：

- 颜色：暖白色 `#fff3d0`
- 强度：2.0 左右
- 方向：从左前上方照射
- 开启阴影：树、角色、虫子投影到地面

### 6.2 环境光

使用淡蓝色 `HemisphereLight` 或 `AmbientLight`。

建议：

- 天空色：淡蓝 `#b8dcff`
- 地面色：草绿色或灰绿
- 强度：0.6 ~ 1.0

### 6.3 玩家头顶泛光灯

在玩家头顶添加跟随灯，提高角色附近可见度。

实现：

- `PointLight` 或 `SpotLight`
- 绑定在 Player entity 上
- 位置：玩家头顶上方 2.5-3.5 units
- 颜色：柔和暖色
- 强度：0.8 ~ 1.2
- 距离：8-12 units

## 7. 摄像机设计

采用第三人称跟随视角。

要求：

- 摄像机始终在角色后方上方。
- 玩家移动或转向时，摄像机平滑跟随。
- 角色始终位于画面中下部，方便观察前方。

参数建议：

```ts
const cameraConfig = {
  distance: 7.5,
  height: 5.0,
  lookAtHeight: 1.2,
  followLerp: 0.12,
  rotateLerp: 0.1,
};
```

摄像机目标：

```text
camera position = player position - player forward * distance + up * height
camera lookAt = player position + up * lookAtHeight
```

后续可扩展：

- 鼠标右键旋转视角
- 自动避障，防止摄像机穿过山体或树
- 抓虫时轻微镜头震动

## 8. 玩家系统

### 8.1 输入

- WASD / 方向键：移动
- E / Space：使用捕虫网
- Q：按住挖洞
- R：退出或结束本局

### 8.2 移动

玩家移动基于地面格子可通行性：

- 湖泊不可通行
- 树干不可通行
- 山地减速
- 道路可适当加速或保持正常速度

### 8.3 角色表现

取消自由创建角色，改为提供几个预设形象供玩家选择。第一版所有角色都使用视觉占位符，重点保证 silhouette、颜色和职业感清晰。

建议预设：

- 草帽探险家：默认形象，平衡型。
- 雨靴小队员：更适合湖泊边探索的视觉主题。
- 山地小侦察：偏山地/树木探索风格。
- 捕虫新手：轻快、明亮、适合儿童玩家。

初版角色占位符可用组合几何体：

- 头：Sphere
- 身体：Box
- 手脚：Cylinder / Box
- 帽子：Cone / Cylinder

后续可替换为低多边形 glTF 模型。替换时保持角色 id、基础属性、碰撞体和动画状态机不变。

### 8.4 玩家动作设计

第一版动作也采用占位符动画，通过几何体位置、旋转和缩放实现。后续替换正式模型后，使用同一套动作状态名称接入骨骼动画。

动作状态：

- `idle`：站立待机，身体轻微上下浮动，头部轻微转动。
- `walk`：普通移动，腿部交替摆动，身体轻微前倾。
- `run`：体力充足或道路上移动时使用，步频更快，身体更明显前倾。
- `netSwing`：按 E / Space 使用捕虫网，手臂向前挥动，网子形成短暂扇形判定。
- `digStart`：按住 Q 后进入挖掘准备，身体朝向洞口。
- `digLoop`：持续挖掘，铲子循环下挖，头顶显示进度条。
- `digInterrupted`：松开 Q 或离开范围时播放短暂停顿/收铲动作，进度清零。
- `digComplete`：挖掘完成，铲子上扬，洞口触发结果反馈。
- `catchSuccess`：抓到虫后短暂举网或弹出高兴动作。
- `poisoned`：中毒状态，身体轻微摇晃，移动被限制。
- `stunned`：被陷阱或负面效果打断时短暂停顿。

动作接入原则：

- 输入系统只发出意图，例如 `move`、`capture`、`digHold`。
- 动作状态机根据玩法状态决定当前动作。
- 捕捉判定和挖掘判定不依赖动画帧，避免模型替换后影响玩法。
- 正式模型上线时，替换 `AnimationClip`，不改 CaptureSystem、DiggingSystem 和 MovementSystem。

## 9. 昆虫系统

### 9.1 昆虫类型

保留当前 7 种昆虫：

- 蚂蚱：跳跃逃跑
- 螳螂：伪装，靠近才明显
- 独角仙：慢速高分，偏树木/山地
- 蝴蝶：飞行曲线飘动
- 知了：树之间飞行，只能停在树上
- 蜘蛛：织网，中毒风险
- 屎壳郎：推球，负分陷阱

实现策略：

- 第一版昆虫全部使用 3D 视觉占位符，例如几何体组合、低多边形轮廓、简化翅膀和肢体。
- 先保证动作、轮廓、颜色和行为差异清晰，再逐步替换高质量模型。
- 每种虫的行为状态机、碰撞体和捕捉判定先稳定，模型替换只影响外观层。

### 9.2 昆虫状态机

```ts
type InsectState =
  | "idle"
  | "moving"
  | "fleeing"
  | "flying"
  | "perched"
  | "enteringBurrow"
  | "insideBurrow"
  | "exitingBurrow"
  | "captured";
```

### 9.3 知了规则

- 出生点必须是树的 perch point。
- 停靠状态下不在地面移动。
- 到时间后选择另一棵树。
- 飞行期间可被捕捉，但判定范围要比地面虫稍小。
- 到达目标树后进入 perched 状态。

## 10. 洞穴系统

保留当前两类洞：

### 10.1 死路洞

- 只有一个出口。
- 虫子进入后必须限时从原洞口出来。
- 玩家挖掘成功时，如果虫子在里面可获得额外奖励。

### 10.2 通道洞

- 有 2-3 个出口。
- 虫子进入后几秒从另一个出口出来。
- 玩家可以挖通道洞，但风险更高、耗时更久。

### 10.3 3D 表现

- 洞口使用低矮圆环或深色凹陷圆盘。
- 通道洞使用蓝色/发光标记。
- 死路洞使用黄色/土色标记。
- 挖掘时在玩家头顶显示进度条，地面显示可挖提示环。

## 11. 抓捕系统

### 11.1 判定

捕虫网使用前方扇形或胶囊体范围：

```ts
interface CaptureArea {
  origin: Vector3;
  direction: Vector3;
  range: number;
  angle: number;
  heightTolerance: number;
}
```

规则：

- 地面虫：距离 + 方向判定。
- 飞行虫：增加高度判定。
- 知了停树上时，玩家必须靠近树并朝向树。

### 11.2 效果提示

玩家抓捕昆虫后需要即时反馈：

- 昆虫位置出现浮动文字：`+20 知了`
- 捕虫网挥动动画
- 粒子闪光
- 音效
- HUD 中分数跳动
- 图鉴首次解锁提示

## 12. UI / HUD

游戏内 HUD：

- 分数
- 体力
- 时间
- 状态：正常/中毒
- 当前捕获数量
- 音乐开关
- 操作提示

3D 场景内提示：

- 头顶挖掘进度条
- 虫子被抓时浮字
- 洞口可挖动态环
- 知了鸣叫声波提示

实现建议：

- 固定 HUD 使用 React/DOM。
- 3D 世界中的浮字可用 CSS2DRenderer 或 Sprite。
- 重要提示不要只依赖颜色，要配合图标/动画。

## 13. 数据持久化

### 13.1 本地版本

继续使用：

- `selectedChar`
- `selectedCharName`
- `bugCatchLeaderboard`
- `bugCatchCaught`

### 13.2 云端版本

后续如果要所有玩家共享排行榜，需要引入后端：

- Supabase：推荐，支持数据库、匿名写入限制、排行榜查询。
- Firebase：适合快速原型。
- Cloudflare D1 + Pages Functions：适合静态部署一体化。

## 14. 性能策略

目标：

- 桌面端 60 FPS
- 普通笔记本稳定 45 FPS+
- 移动端后续再专项优化

策略：

- 地面用单个 Mesh。
- 树木可以用 InstancedMesh。
- 昆虫数量控制在 15-25。
- 湖泊和山地尽量使用低面数几何。
- 阴影只给主角、树、较大的物体开启。
- 远处昆虫简化动画。
- UI 与 Three.js 渲染解耦，避免 React 每帧重渲染。

## 15. 迁移方案

### Phase 1：3D 技术底座

- Vite + TypeScript 初始化
- Three.js 场景
- 草地/棋盘地面
- 阳光、环境光、玩家跟随灯
- 第三人称摄像机
- 玩家移动和湖泊碰撞
- 树木和昆虫先用视觉占位符实现

### Phase 2：生态地图

- 随机树木 15-20 个
- 随机湖泊
- 山地区域
- 地形影响移动速度
- 小地图或调试视图

### Phase 3：核心玩法迁移

- 昆虫生成
- 捕虫网判定
- 分数与浮字提示
- 洞穴系统
- Q 按住挖洞进度

### Phase 4：昆虫 AI

- 7 种昆虫行为迁移
- 知了树间飞行
- 毒虫状态
- 稀有虫出现规则
- 占位符模型保持不变，后续可逐个替换为正式三维模型

### Phase 5：产品化

- 首页/预设角色选择/图鉴/排行榜迁移
- 音乐和音效
- 结束页总结
- GitHub Pages 部署
- 性能和移动端适配

## 16. 风险与取舍

### 16.1 风险

- 3D 复杂度提高，单文件开发方式不可持续。
- 摄像机和碰撞如果设计不好，操作会比 2D 更难。
- 3D 模型资产会带来加载和风格一致性问题。
- 移动端性能需要额外优化。

### 16.2 取舍

- 第一版优先用低多边形几何体，不急着上复杂模型。
- 第一版不引入重型物理引擎，使用网格碰撞。
- 第一版不做在线排行榜，先保留本地存储。
- 第一版以玩法可读性优先，视觉效果适度增强。

## 17. 验收标准

第一版 3D 原型完成时，应满足：

- 玩家可在大型草地/棋盘地面上移动。
- 湖泊不可通行。
- 山地影响移动速度。
- 随机生成 15-20 棵立方体树。
- 有太阳主光源、淡蓝环境光、玩家头顶跟随灯。
- 摄像机第三人称跟随，角色始终清晰可见。
- 至少 3 种昆虫可被抓捕。
- 抓捕后有分数、音效、浮字或粒子提示。
- 游戏可通过 GitHub Pages 部署访问。
