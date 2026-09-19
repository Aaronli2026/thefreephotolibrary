const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 1, maxlength: 30, trim: true },
  // 保留旧用户字段以兼容已有数据；新用户不再需要邮箱或密码。
  email: { type: String, unique: true, sparse: true },
  password: { type: String, select: false },
  guestId: { type: String, unique: true, sparse: true },
  isGuest: { type: Boolean, default: true },
  avatar: String,
  bio: String,
  uploadedPhotos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
