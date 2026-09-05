const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Photo = require('../models/Photo');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 上传照片
router.post('/upload', verifyToken, upload.single('photo'), [
  body('title').notEmpty(),
  body('description').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { title, description, category, tags } = req.body;
    const photo = new Photo({
      title,
      description,
      category,
      tags: tags ? tags.split(',') : [],
      filename: req.file.filename,
      filepath: req.file.path,
      uploader: req.user.id
    });

    await photo.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { uploadedPhotos: photo._id } });

    res.status(201).json({ message: '照片上传成功', photo });
  } catch (err) {
    res.status(500).json({ error: '上传失败', message: err.message });
  }
});

// 搜索照片
router.get('/search', async (req, res) => {
  try {
    const { keyword, category, sort } = req.query;
    let query = {};

    if (keyword) {
      query = {
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [new RegExp(keyword, 'i')] } }
        ]
      };
    }

    if (category) {
      query.category = category;
    }

    let sortBy = { createdAt: -1 };
    if (sort === 'downloads') {
      sortBy = { downloads: -1 };
    } else if (sort === 'rating') {
      sortBy = { averageRating: -1 };
    } else if (sort === 'views') {
      sortBy = { views: -1 };
    }

    const photos = await Photo.find(query)
      .sort(sortBy)
      .populate('uploader', 'username avatar')
      .limit(20);

    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: '搜索失败', message: err.message });
  }
});

// 获取单个照片
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('uploader', 'username avatar bio')
      .populate('comments');

    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }

    // 增加浏览次数
    photo.views += 1;
    await photo.save();

    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: '获取照片失败', message: err.message });
  }
});

// 下载照片
router.post('/:id/download', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }

    photo.downloads += 1;
    await photo.save();

    res.download(photo.filepath);
  } catch (err) {
    res.status(500).json({ error: '下载失败', message: err.message });
  }
});

// 删除照片
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }

    if (photo.uploader.toString() !== req.user.id) {
      return res.status(403).json({ error: '无权删除此照片' });
    }

    await Photo.findByIdAndDelete(req.params.id);
    res.json({ message: '照片已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除失败', message: err.message });
  }
});

module.exports = router;
