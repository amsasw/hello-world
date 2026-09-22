# LitePic

一个基于 GitHub Pages + GitHub Contents API 的极简图床。

## v2 架构

网页代码和图片已经分开：

```text
main
├── index.html
├── style.css
├── app.js
└── .github/workflows/pages.yml

images
└── images/
    └── YYYY/MM/
        └── <timestamp>-filename.webp
```

- `main`：只维护网页代码并部署 GitHub Pages
- `images`：专门保存图片
- 上传图片只提交到 `images` 分支，因此不会触发 Pages 重新部署

## 当前功能

- GitHub Token 直接上传到 `images` 分支
- 上传前在浏览器本地自动转换 WebP
- WebP 质量可调
- 可限制最大边长
- 如果 WebP 反而更大，会自动保留原图
- GIF 保留原动画
- 自动生成 Raw / jsDelivr / Markdown / HTML
- 历史图库读取 `images` 分支
- 历史搜索、预览、复制直链与 Markdown
- Token 仅保存在当前页面内存，不写入仓库或 localStorage

## Token 权限

建议使用 Fine-grained Personal Access Token，仅授权：

- Repository: `amsasw/hello-world`
- Contents: **Read and write**
- Metadata: Read-only

## WebP 默认策略

- 质量：82
- 最大边长：2560 px
- PNG / JPEG / WebP：尝试转换为 WebP
- GIF：保持原文件
- 如果转换结果没有更小且未缩放，则保留原图

## 历史版本

- `backup-token-version`：最初的 GitHub Token 直传版本
- 匿名 img402 版本仍保留在 Git 历史中
