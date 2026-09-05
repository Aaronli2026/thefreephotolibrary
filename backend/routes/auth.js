const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ error: '用户已存在' });
    }

    // 创建新用户
    user = new User({ username, email, password });
    await user.save();

    // 生成 JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: '注册成功', token, user: { id: user._id, username, email } });
  } catch (err) {
    res.status(500).json({ error: '注册失败', message: err.message });
  }
});

// 登录
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: '密码错误' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: '登录成功', token, user: { id: user._id, username: user.username, email } });
  } catch (err) {
    res.status(500).json({ error: '登录失败', message: err.message });
  }
});

// 获取当前用户信息
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('uploadedPhotos');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败', message: err.message });
  }
});

module.exports = router;
