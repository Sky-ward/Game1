# 修仙题材随机肉鸽（Cocos Creator 3.8 TS）

## ✅ 直接用 Cocos Dashboard 导入本仓库（小白版）
1. 打开 Cocos Dashboard。
2. 点击「导入项目」。
3. 选择这个仓库的**根目录**（能看到 `settings/` 的那一层）。
4. 导入完成后，双击项目打开即可。

### 打开后如何运行（必须）
1. 在 Creator 中打开任意场景（默认场景即可）。
2. 选中 `Canvas` 节点。
3. 添加组件：`Boot`（路径：`assets/scripts/Boot.ts`）。
4. 点击运行预览即可进入菜单。

### 如何构建抖音/微信
1. 打开 Creator 顶部菜单：`项目 -> 构建发布`。
2. 选择平台：`抖音小游戏` 或 `微信小游戏`。
3. 按提示填写 AppID/抖音参数，点击构建即可。

## 目录结构
```
assets/
  scripts/
    Boot.ts
    framework/
      platform/
      ui/
    games/xianxia/
  resources/
    xianxia/configs/
```

## 入口挂载（必须）
1. 在 Cocos Creator 打开项目。
2. 在默认场景中选中 `Canvas` 节点。
3. 添加组件：`Boot`（路径：`assets/scripts/Boot.ts`）。
4. 运行预览即可进入菜单。

## 运行预览
- 编辑器预览：点击运行，自动走 DummyAdapter，完整跑通菜单 → 战斗 → 奖励 → 商店/奇遇 → Boss → 结算 → 重开。

## 导入成功自检清单
- 根目录包含 `settings/`。
- Cocos Dashboard 可导入。
- 打开后预览运行无红错。
- `git pull` 更新后 Cocos 自动识别变更（无需手动覆盖）。

## 怎么玩（5 步）
1. 点击“开始新局”，生成一张 3 幕 × 5 节点的地图。
2. 在地图界面点“进入当前节点”，开始战斗/奇遇/商店等事件。
3. 战斗胜利后选奖励；商店可买东西；奇遇按按钮做选择。
4. 每次处理完节点后，点“继续前进”推进下一节点。
5. 打完 3 幕进入结算，点“重开一局”再玩一轮。

## 平台能力适配
- 所有平台 API 仅允许出现在 `assets/scripts/framework/platform/adapters/` 中。
- 编辑器/浏览器会自动降级 `DummyAdapter`。

## 广告位配置（预留）
- 预留接口：`Platform.showRewardedAd(adUnitId)`。
- 后续把广告位 id 写到你自己的配置（建议新增 `configs/runtime.json`），然后在 `GameManager` 或 `Boot` 调用即可。

## 抖音侧边栏复访能力
- DouyinAdapter 内已封装 `getLaunchOptionsSync` 并在启动时打印 `scene/query`。
- 复访入口可以在主菜单提示位置展示（当前 UI 顶部信息栏会显示 scene/query）。

## 平台隔离自检
建议在项目根目录执行：
```
rg -n "wx\\.|tt\\." assets/scripts -g"*.ts"
```
应只命中 `assets/scripts/framework/platform/adapters/` 与 `assets/scripts/typings/platform.d.ts`。

## 配置加载自检
- 配置文件均位于 `assets/resources/xianxia/configs/`。
- 运行时控制台会输出 `[Config] loaded` 列表。

## 验收标准（MVP）
- 运行后从菜单开始一局，能走完至少 5 个节点并结算。
- Debug/GM 面板可用：加灵石、加道心、跳节点、刷新商店、强制海克斯、查看保底。
- 平台隔离通过 `rg` 检查。
- JSON 配置可加载并驱动羁绊/海克斯/弟子/法宝/奇遇。

## 关键玩法说明
- 单局结构：3 幕 × 5 节点，含斗法/奇遇/坊市/妖王/劫境节点。
- 成长系统：弟子升阶、羁绊断点 2/4/6、海克斯四类池、法宝组件/成品。

更多构建步骤见 [BUILD.md](BUILD.md)，提审注意事项见 [CHECKLIST.md](CHECKLIST.md)。
