const express = require('express');
const { body, validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const Photo = require('../models/Photo');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// 评分
router.post('/', verifyToken, [
  body('score').isInt({ min: 1, max: 5 }),
  body('photoId').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { score, photoId } = req.body;
    
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }

    // 检查用户是否已评分
    let rating = await Rating.findOne({ rater: req.user.id, photo: photoId });
    
    if (rating) {
      // 更新评分
      rating.score = score;
      await rating.save();
    } else {
      // 创建新评分
      rating = new Rating({
        score,
        rater: req.user.id,
        photo: photoId
      });
      await rating.save();
      await Photo.findByIdAndUpdate(photoId, { $push: { ratings: rating._id } });
    }

    // 更新照片的平均评分
    const ratings = await Rating.find({ photo: photoId });
    const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    
    await Photo.findByIdAndUpdate(photoId, {
      averageRating: avgRating,
      ratingCount: ratings.length
    });

    res.json({ message: '评分成功', rating });
  } catch (err) {
    res.status(500).json({ error: '评分失败', message: err.message });
  }
});

// 获取照片评分
router.get('/photo/:photoId', async (req, res) => {
  try {
    const ratings = await Rating.find({ photo: req.params.photoId })
      .populate('rater', 'username avatar');

    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: '获取评分失败', message: err.message });
  }
});

// 删除评分
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ error: '评分不存在' });
    }

    if (rating.rater.toString() !== req.user.id) {
      return res.status(403).json({ error: '无权删除此评分' });
    }

    await Rating.findByIdAndDelete(req.params.id);
    await Photo.findByIdAndUpdate(rating.photo, { $pull: { ratings: req.params.id } });

    // 重新计算平均评分
    const ratings = await Rating.find({ photo: rating.photo });
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0;
    
    await Photo.findByIdAndUpdate(rating.photo, {
      averageRating: avgRating,
      ratingCount: ratings.length
    });

    res.json({ message: '评分已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除评分失败', message: err.message });
  }
});

module.exports = router;
