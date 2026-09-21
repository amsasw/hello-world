# LitePic

一个打开就能用的极简公开图床前端。

在线站点：

https://amsasw.github.io/hello-world/

## 当前版本

当前 `main` 分支使用 **img402.dev 免费匿名上传 API**。

工作流程：

```text
GitHub Pages
   ↓
img402.dev /api/free
   ↓
返回公开图片 URL
```

不需要：

- GitHub 登录
- GitHub Personal Access Token
- API Key
- 用户账号

## 免费上传规则

- 支持 PNG / JPEG / GIF / WebP
- 最大 10 MB
- ≤ 1 MB：免费永久链接
- 1–10 MB：免费保存 30 天
- 所有上传图片都是公开图片

## 重要变化

图片 **不再保存到 `amsasw/hello-world` GitHub 仓库**。

这个仓库只托管 LitePic 前端页面，实际图片由 img402.dev 提供存储和公开 URL。

## 旧版备份

原来的“GitHub Token 直接上传到仓库”版本已经保存在：

```text
backup-token-version
```

如果以后想恢复 GitHub 仓库存图方案，可以从该分支恢复。

## 安全提示

公共图床不适合存储：

- 私人照片
- 密钥、Token、密码
- 身份证件
- 公司机密
- 其他不希望公开传播的内容
