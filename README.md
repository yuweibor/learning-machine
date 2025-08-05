# Card Game

一个基于 HTML5 Canvas、TypeScript 和 React 的游戏脚手架项目。

## 技术栈

- **HTML5 Canvas** - 游戏渲染
- **TypeScript** - 类型安全的 JavaScript
- **React** - UI 框架
- **Webpack** - 模块打包工具

## 项目结构

```
card/
├── public/
│   └── index.html          # HTML 模板
├── src/
│   ├── App.tsx             # 主 React 组件
│   ├── Game.ts             # 游戏核心逻辑类
│   ├── index.tsx           # 应用入口点
│   └── index.css           # 全局样式
├── package.json            # 项目依赖和脚本
├── tsconfig.json           # TypeScript 配置
├── webpack.config.js       # Webpack 配置
└── README.md              # 项目说明
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm start
# 或者
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 功能特性

- ✅ TypeScript 支持
- ✅ React 组件化架构
- ✅ HTML5 Canvas 游戏渲染
- ✅ Webpack 热重载开发环境
- ✅ 游戏循环和动画系统
- ✅ 响应式设计

## 开发说明

### 游戏类 (Game.ts)

游戏的核心逻辑在 `Game.ts` 文件中，包含：

- `start()` - 启动游戏循环
- `stop()` - 停止游戏循环
- `update()` - 游戏逻辑更新
- `render()` - 游戏渲染

### 添加新功能

1. 在 `Game.ts` 中添加游戏逻辑
2. 在 `App.tsx` 中添加 UI 控制
3. 在 `index.css` 中添加样式

## 浏览器支持

支持所有现代浏览器，包括：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+