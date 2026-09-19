require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'https://aaronli2026.github.io')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // 允许浏览器直接访问健康检查，也允许本地开发环境。
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(new Error('不允许的跨域来源'));
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!process.env.MONGODB_URI) {
  console.error('缺少 MONGODB_URI 环境变量');
} else {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB 连接成功'))
    .catch(err => console.error('MongoDB 连接失败:', err.message));
}

const authRoutes = require('./backend/routes/auth');
const photoRoutes = require('./backend/routes/photos');
const commentRoutes = require('./backend/routes/comments');
const ratingRoutes = require('./backend/routes/ratings');

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: '服务器正常运行' });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: '服务器错误', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
