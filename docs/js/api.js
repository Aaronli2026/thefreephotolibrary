const API_BASE = (() => {
  if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/$/, '');
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return 'http://localhost:5000/api';
  return 'https://thefreephotolibrary-api.onrender.com/api';
})();
function getToken() { return localStorage.getItem('guestToken'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
function clearGuest() { ['guestToken', 'user', 'guestId'].forEach(key => localStorage.removeItem(key)); }
async function apiCall(endpoint, method = 'GET', body = null, useToken = true) {
  const headers = {};
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (useToken && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let response;
  try { response = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined }); }
  catch (_) { throw new Error(`无法连接服务器（${API_BASE}）。请确认后端已经部署并正在运行`); }
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : {};
  if (!response.ok) throw new Error(data.error || `请求失败（${response.status}）`);
  return data;
}
async function enterAsGuest(username) { const guestId = localStorage.getItem('guestId') || crypto.randomUUID(); const data = await apiCall('/auth/guest', 'POST', { username, guestId }, false); localStorage.setItem('guestId', guestId); localStorage.setItem('guestToken', data.token); localStorage.setItem('user', JSON.stringify(data.user)); return data; }
function searchPhotos(keyword = '', category = '', sort = '') { const params = new URLSearchParams({ ...(keyword && { keyword }), ...(category && { category }), ...(sort && { sort }) }); return apiCall(`/photos/search?${params}`, 'GET', null, false); }
function getPhoto(id) { return apiCall(`/photos/${id}`, 'GET', null, false); }
function getComments(id) { return apiCall(`/comments/photo/${id}`, 'GET', null, false); }
function addComment(photoId, content) { return apiCall('/comments', 'POST', { photoId, content }); }
function ratePhoto(photoId, score) { return apiCall('/ratings', 'POST', { photoId, score }); }
function removeComment(id) { return apiCall(`/comments/${id}`, 'DELETE'); }
function uploadPhoto(formData) { return apiCall('/photos/upload', 'POST', formData); }
function downloadPhoto(id) { window.location.href = `${API_BASE}/photos/${id}/download`; }
Object.assign(window, { getToken, getUser, enterAsGuest, searchPhotos, getPhoto, getComments, addComment, ratePhoto, removeComment, uploadPhoto, downloadPhoto, clearGuest });
