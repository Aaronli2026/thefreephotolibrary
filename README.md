# thefreephotolibrary

一个免费、无广告的图片和视频素材库。

## 在线访问

https://aaronli2026.github.io/thefreephotolibrary/

## 部署后端（修复“请求失败”）

GitHub Pages 只能托管静态前端，不能运行 Express 和 MongoDB。本项目已提供 `render.yaml`，推荐使用 Render 部署后端：

1. 登录 Render，选择 **New → Blueprint**，连接此仓库。
2. Render 会读取 `render.yaml` 并创建 `thefreephotolibrary-api` 服务。
3. 在服务的 Environment 中设置 `MONGODB_URI`（MongoDB Atlas 连接字符串）。`JWT_SECRET` 会自动生成。
4. 等待部署完成，打开 `https://thefreephotolibrary-api.onrender.com/api/test`，应看到：

   `{ "message": "服务器正常运行" }`

5. 刷新 GitHub Pages 网站。前端已经默认请求：

   `https://thefreephotolibrary-api.onrender.com/api`

如果 Render 分配了不同的服务地址，请在 `frontend/js/api.js` 和 `docs/js/api.js` 中把 `thefreephotolibrary-api.onrender.com` 改成实际地址后提交。

## 本地开发

```bash
npm install
cp .env.example .env
npm start
```

`.env` 至少需要配置 `MONGODB_URI` 和 `JWT_SECRET`。
