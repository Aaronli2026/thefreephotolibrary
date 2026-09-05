const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 确保一个用户只能对一张照片评分一次
ratingSchema.index({ rater: 1, photo: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
