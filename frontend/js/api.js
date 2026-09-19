const API_BASE = (() => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return `${window.location.origin}/api`;
})();

function getToken() { return localStorage.getItem('guestToken'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
function clearGuest() {
  localStorage.removeItem('guestToken');
  localStorage.removeItem('user');
  localStorage.removeItem('guestId');
}

async function apiCall(endpoint, method = 'GET', body = null, useToken = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useToken && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : { error: '服务端未返回 JSON 数据' };
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function enterAsGuest(username) {
  const guestId = localStorage.getItem('guestId') || crypto.randomUUID();
  const data = await apiCall('/auth/guest', 'POST', { username, guestId }, false);
  localStorage.setItem('guestId', guestId);
  localStorage.setItem('guestToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

async function uploadPhoto(formData) {
  const response = await fetch(`${API_BASE}/photos/upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData
  });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : { error: '上传接口未返回 JSON 数据' };
  if (!response.ok) throw new Error(data.error || '上传失败');
  return data;
}
async function searchPhotos(keyword = '', category = '', sort = '') {
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (category) params.append('category', category);
  if (sort) params.append('sort', sort);
  return apiCall(`/photos/search?${params}`, 'GET', null, false);
}
function getPhoto(id) { return apiCall(`/photos/${id}`, 'GET', null, false); }
function getComments(id) { return apiCall(`/comments/photo/${id}`, 'GET', null, false); }
function addComment(photoId, content) { return apiCall('/comments', 'POST', { photoId, content }); }
function ratePhoto(photoId, score) { return apiCall('/ratings', 'POST', { photoId, score }); }
function removeComment(id) { return apiCall(`/comments/${id}`, 'DELETE'); }
function downloadPhoto(id) { window.location.href = `${API_BASE}/photos/${id}/download`; }

window.getToken = getToken;
window.getUser = getUser;
window.enterAsGuest = enterAsGuest;
window.uploadPhoto = uploadPhoto;
window.searchPhotos = searchPhotos;
window.getPhoto = getPhoto;
window.getComments = getComments;
window.addComment = addComment;
window.ratePhoto = ratePhoto;
window.removeComment = removeComment;
window.downloadPhoto = downloadPhoto;
window.clearGuest = clearGuest;
