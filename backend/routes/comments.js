const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Photo = require('../models/Photo');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// 添加评论
router.post('/', verifyToken, [
  body('content').notEmpty().trim().isLength({ min: 1, max: 1000 }),
  body('photoId').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { content, photoId } = req.body;
    
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }

    const comment = new Comment({
      content,
      author: req.user.id,
      photo: photoId
    });

    await comment.save();
    await Photo.findByIdAndUpdate(photoId, { $push: { comments: comment._id } });

    const populatedComment = await comment.populate('author', 'username avatar');
    res.status(201).json({ message: '评论成功', comment: populatedComment });
  } catch (err) {
    res.status(500).json({ error: '添加评论失败', message: err.message });
  }
});

// 获取评论
router.get('/photo/:photoId', async (req, res) => {
  try {
    const comments = await Comment.find({ photo: req.params.photoId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: '获取评论失败', message: err.message });
  }
});

// 删除评论
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: '无权删除此评论' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    await Photo.findByIdAndUpdate(comment.photo, { $pull: { comments: req.params.id } });

    res.json({ message: '评论已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除评论失败', message: err.message });
  }
});

module.exports = router;
