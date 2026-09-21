# LitePic

一个基于 GitHub Pages + GitHub Contents API 的极简图床。

## 当前功能

- GitHub Token 直接上传到 `amsasw/hello-world/images/`
- 上传前在浏览器本地自动转换 WebP
- WebP 质量可调
- 可限制最大边长，进一步减少仓库占用
- 如果 WebP 反而更大，会自动保留原图
- GIF 保留原动画，不做 WebP 转换
- 自动生成 Raw / jsDelivr / Markdown / HTML
- 历史图库：读取仓库 `images/` 下已有图片
- 历史搜索、预览、复制直链与 Markdown
- Token 仅保存在当前页面内存，不写入仓库或 localStorage

## Token 权限

建议使用 Fine-grained Personal Access Token，并仅授权：

- Repository: `amsasw/hello-world`
- Contents: **Read and write**
- Metadata: Read-only（GitHub 自动要求）

## 目录

上传图片按月份保存：

```text
images/YYYY/MM/<timestamp>-filename.webp
```

## WebP 策略

默认：

- 质量：82
- 最大边长：2560 px
- PNG/JPEG/WebP 静态图片：尝试转为 WebP
- GIF：保持原文件
- 如果转换后的 WebP 不比原图小，并且没有发生缩放，则保留原图

旧的匿名 img402 版本仍然保留在 Git 历史中；原 Token 版备份分支为 `backup-token-version`。
