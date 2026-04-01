# Cyber Zen (Pure Frontend)

一套纯前端、无后端、无依赖安装的「赛博禅意」沉浸写作/心流环境：

- **The Canvas**：WebGL/Shader 全屏动态背景（`Rain` / `Star`）
- **The Deck**：无边框毛玻璃编辑器，3 种内置字体栈
- **Vibe Mixer**：隐藏式浮窗滑杆（雨/雪强度、模糊度、白噪音、音乐融合）
- **ZenTimer**：极简线性 + 环形消融倒计时
- **Privacy**：仅 LocalStorage 实时暂存，支持导出 `.txt`

## 使用

直接用浏览器打开 `index.html` 即可（推荐 Chrome / Edge）。

> 音频需要一次用户点击授权：点右侧 `Audio: Off` 开关即可启用。

## 使用 ShaderToy 的 Heartfelt（ltffzl）

由于 ShaderToy 对自动抓取常见会返回 403（Cloudflare 防护），本项目不内置在线拉取代码。

你可以这样接入：

- 在 ShaderToy 页面打开 `Code`，选择 **Image**，复制完整 shader 代码（包含 `mainImage(...)`）
- 粘贴到 `main.js` 里 `SHADERTOY_RAIN_IMAGE_CODE`（把 `null` 替换成模板字符串）

粘贴后刷新页面，Rain 模式会优先使用 ShaderToy 版本。

## 交互提示

- 顶部模式切换（`Rain/Star`）只会在鼠标进入屏幕顶部 50px 区域时显示
- UI 非活跃时透明度趋近于 0；悬停/聚焦时优雅淡入
- 切换模式不会清空或重置编辑器内容/字体/毛玻璃状态

