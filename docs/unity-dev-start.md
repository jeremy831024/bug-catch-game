# Unity 开发启动说明

## 1. 当前状态

已在 `unity/` 下加入第一版 Unity LTS 原型骨架。当前版本不是最终美术工程，而是可运行的玩法原型代码。

已实现：

- 运行时自动生成草地、湖泊、山地、树木、食物、毒区和昆虫
- 第三人称玩家移动
- 体力持续消耗、奔跑额外消耗、食物恢复
- 捕虫网交互
- 可捕捉、仅观察、危险不可捕捉三类昆虫
- 胡蜂危险事件
- 简单 HUD、分数、最佳分数、本地图鉴数据保存

## 2. 如何运行

1. 用 Unity 2022.3 LTS 或更新的 Unity LTS 打开 `unity/` 文件夹。
2. 在顶部菜单点击 `Bug Catch/Create Prototype Scene`。
3. 打开自动保存的 `Assets/Game/Scenes/Prototype.unity`。
4. 点击 Play。

第一版故意不依赖手工 Prefab 引用，`GameBootstrap` 会自动生成所有占位符对象。

## 3. 控制方式

- `WASD` / 方向键：移动
- `Left Shift`：奔跑，额外消耗体力
- `E` / `Space`：捕捉、观察或触发交互

## 4. 初始昆虫规则

- 可捕捉：蚂蚱、铜绿丽金龟、蟋蟀、菜粉蝶
- 仅观察：鹿角花金龟
- 危险不可捕捉：胡蜂群

这些数据目前写在 `InsectCatalog.cs`，后续应迁移成 ScriptableObject 或 Addressables 数据资源。

## 5. 下一步建议

优先级：

1. 在 Unity 编辑器中创建正式场景并保存 `.unity` 场景文件。
2. 把 `InsectCatalog`、`EquipmentCatalog`、`BiomeCatalog` 迁移为 ScriptableObject。
3. 替换玩家、昆虫、树木、食物、危险物的占位符模型。
4. 接入动画状态机。
5. 加入角色预设选择界面。
6. 加入正式图鉴和排行榜 UI。
