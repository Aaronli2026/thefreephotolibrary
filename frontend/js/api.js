const API_BASE = 'http://localhost:5000/api';

// 获取 localStorage 中的 token
function getToken() {
  return localStorage.getItem('token');
}

// 设置 token
function setToken(token) {
  localStorage.setItem('token', token);
}

// 清除 token
function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// API 调用函数
async function apiCall(endpoint, method = 'GET', body = null, useToken = true) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (useToken && getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// 搜索照片
async function searchPhotos(keyword = '', category = '', sort = '') {
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (category) params.append('category', category);
  if (sort) params.append('sort', sort);

  return apiCall(`/photos/search?${params.toString()}`, 'GET', null, false);
}

// 获取单个照片
async function getPhoto(id) {
  return apiCall(`/photos/${id}`, 'GET', null, false);
}

// 上传照片
async function uploadPhoto(formData) {
  const token = getToken();
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  const response = await fetch(`${API_BASE}/photos/upload`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '上传失败');
  }
  return data;
}

// 注册
async function register(username, email, password) {
  return apiCall('/auth/register', 'POST', { username, email, password }, false);
}

// 登录
async function login(email, password) {
  return apiCall('/auth/login', 'POST', { email, password }, false);
}

// 获取当前用户
async function getCurrentUser() {
  return apiCall('/auth/me', 'GET');
}

// 添加评论
async function addComment(photoId, content) {
  return apiCall('/comments', 'POST', { photoId, content });
}

// 获取评论
async function getComments(photoId) {
  return apiCall(`/comments/photo/${photoId}`, 'GET', null, false);
}

// 删除评论
async function deleteComment(commentId) {
  return apiCall(`/comments/${commentId}`, 'DELETE');
}

// 评分
async function ratePhoto(photoId, score) {
  return apiCall('/ratings', 'POST', { photoId, score });
}

// 获取评分
async function getRatings(photoId) {
  return apiCall(`/ratings/photo/${photoId}`, 'GET', null, false);
}

// 删除评分
async function deleteRating(ratingId) {
  return apiCall(`/ratings/${ratingId}`, 'DELETE');
}

// 下载照片
async function downloadPhoto(photoId) {
  window.location.href = `${API_BASE}/photos/${photoId}/download`;
}
