# 构建到抖音 / 微信小游戏

> 以下步骤基于 Cocos Creator 3.8。

## 抖音小游戏（tt）
1. 打开 Cocos Creator → `项目` → `构建发布`。
2. 选择 `字节跳动小游戏` 平台，输出路径建议 `build/bytedance-mini-game/`。
3. 构建完成后，打开抖音开发者工具：
   - 选择“导入项目”，指向 `build/bytedance-mini-game/`。
4. 预览或上传。

## 微信小游戏（wx）
1. 打开 Cocos Creator → `项目` → `构建发布`。
2. 选择 `微信小游戏` 平台，输出路径建议 `build/wechatgame/`。
3. 构建完成后，打开微信开发者工具：
   - 选择“导入项目”，指向 `build/wechatgame/`。
4. 预览或上传。

## 常见问题
- 若报资源加载问题，确认 JSON 放在 `assets/resources/xianxia/configs/`。
- 若报平台 API 问题，确认非适配器文件没有 `wx.`/`tt.` 调用。
