# Godot 开发启动说明

## 1. 当前状态

项目已切换到 `godot/` 工程。Unity 工程目录和 Unity 命名文档已从仓库移除。

当前 Godot 原型已实现：

- 运行时自动生成草地、湖泊、山地、树木、食物、毒区和昆虫
- 第三人称玩家移动
- 体力持续消耗、奔跑额外消耗、食物恢复
- 捕虫网交互
- 可捕捉、仅观察、危险不可捕捉三类昆虫
- 胡蜂危险事件
- 简单 HUD、分数、最佳分数、本地图鉴数据保存

## 2. 如何运行

1. 用 Godot 4.6.x 打开 `godot/` 文件夹。
2. 打开 `scenes/main.tscn`。
3. 点击运行。

命令行校验：

```bash
/Applications/Godot.app/Contents/MacOS/Godot --headless --path godot --quit
```

## 3. 控制方式

- `WASD`：移动
- `Shift`：奔跑，额外消耗体力
- `E` / `Space`：捕捉、观察或触发交互

## 4. 初始昆虫规则

- 可捕捉：蚂蚱、铜绿丽金龟、蟋蟀、菜粉蝶
- 仅观察：鹿角花金龟
- 危险不可捕捉：胡蜂群

这些数据目前写在 `godot/scripts/data/insect_catalog.gd`，后续应迁移成 Godot Resource `.tres`。

## 5. 下一步建议

1. 把昆虫、装备、地图数据迁移为 Resource。
2. 增加角色预设选择界面。
3. 替换玩家、昆虫、树木、食物、危险物的占位符模型。
4. 接入 `AnimationPlayer` 或 `AnimationTree`。
5. 加入正式图鉴和排行榜 UI。
