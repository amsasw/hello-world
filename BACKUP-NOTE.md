# LitePic Token 版本备份

这个分支保存的是 LitePic 的 **GitHub Token 直传仓库版**。

## 备份时间

2026-09-21

## 这个版本怎么工作

浏览器中的 LitePic 页面直接调用 GitHub Contents API，把图片写入：

`amsasw/hello-world/images/`

因此上传者必须提供一个对该仓库具有 **Contents: Read and write** 权限的 GitHub Personal Access Token。

## 为什么 main 不再使用这个方案

为了让页面做到：

- 打开即可上传
- 不登录
- 不输入 GitHub Token
- 不暴露仓库写权限

`main` 将改为使用公开匿名图床服务上传图片。

## 如何恢复

如果未来需要恢复“图片保存在 GitHub 仓库”的版本，可以从本分支：

`backup-token-version`

重新合并或恢复到 `main`。

> 注意：不要把 GitHub Token 硬编码进公开的 GitHub Pages 前端。
