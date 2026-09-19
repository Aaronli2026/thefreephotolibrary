const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// 无密码注册/登录：用户只需输入���户名。guestId 让同一浏览器可以继续使用原账号。
router.post('/guest', [body('username').trim().isLength({ min: 1, max: 30 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: '请输入 1-30 个字符的用户名' });

  try {
    const username = req.body.username.trim();
    const guestId = req.body.guestId;
    let user = guestId ? await User.findOne({ guestId }) : null;

    if (!user) {
      user = await User.findOne({ username });
      if (user && user.guestId && user.guestId !== guestId) {
        return res.status(409).json({ error: '用户名已被使用，请换一个用户名' });
      }
    }

    if (!user) {
      user = await User.create({ username, guestId, isGuest: true });
    } else if (user.username !== username) {
      user.username = username;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ message: '创建账号成功', token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: '创建账号失败', message: err.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('uploadedPhotos');
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败', message: err.message });
  }
});

module.exports = router;
