# GitHub Pages 部署指南

本项目已配置为使用 GitHub Pages 自动部署。以下是设置和使用说明：

## 自动部署配置

### 1. 仓库设置

1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 `gh-pages` 分支作为部署源

### 2. 配置文件说明

- **config.toml**: Hugo 站点配置文件
  - 需要修改 `baseURL` 为你的 GitHub Pages 地址
  - 格式：`https://your-username.github.io/your-repo-name`

- **.github/workflows/deploy.yml**: GitHub Actions 工作流
  - 自动构建 React 应用和 Hugo 站点
  - 部署到 `gh-pages` 分支

### 3. 部署流程

当你推送代码到 `main` 或 `master` 分支时，GitHub Actions 会自动：

1. 安装 Node.js 依赖
2. 构建 React 应用（生成 `dist` 目录）
3. 安装 Hugo
4. 构建 Hugo 站点（生成 `public` 目录）
5. 部署到 GitHub Pages

## 手动配置步骤

### 1. 修改配置文件

编辑 `config.toml`：
```toml
baseURL = "https://your-username.github.io/your-repo-name"
```

### 2. 推送到 GitHub

```bash
git add .
git commit -m "Add GitHub Pages configuration"
git push origin main
```

### 3. 启用 GitHub Pages

1. 进入仓库的 Settings 页面
2. 滚动到 "Pages" 部分
3. 在 "Source" 下选择 "Deploy from a branch"
4. 选择 `gh-pages` 分支
5. 点击 "Save"

## 访问站点

部署完成后，你可以通过以下地址访问：
- 主页：`https://your-username.github.io/your-repo-name`
- 游戏：`https://your-username.github.io/your-repo-name/dist/index.html`

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 GitHub Actions 日志
   - 确保所有依赖都在 `package.json` 中

2. **页面无法访问**
   - 确认 GitHub Pages 已启用
   - 检查 `baseURL` 配置是否正确

3. **资源加载失败**
   - 确保所有资源路径使用相对路径
   - 检查 webpack 配置中的 `publicPath`

### 调试步骤

1. 查看 GitHub Actions 运行日志
2. 检查 `gh-pages` 分支的内容
3. 验证 GitHub Pages 设置
4. 测试本地构建：`npm run build && hugo`

## 自定义域名（可选）

如果你有自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名（如：`example.com`）
3. 在域名提供商处设置 CNAME 记录指向 `your-username.github.io`
4. 更新 `config.toml` 中的 `baseURL`

## 注意事项

- GitHub Pages 有使用限制（每月 100GB 带宽，1GB 存储）
- 部署可能需要几分钟时间
- 确保仓库是公开的（除非使用 GitHub Pro）
- 静态文件大小建议控制在合理范围内