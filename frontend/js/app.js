const state = { photoId: null };

function currentUser() {
  try { return getUser(); } catch (_) { return null; }
}

function nav() {
  const user = currentUser();
  return `<nav class="navbar">
    <div class="logo">📸 自由图片库</div>
    <ul class="nav-links">
      <li><a href="#" onclick="renderHome(); return false;">首页</a></li>
      <li><a href="#" onclick="renderExplore(); return false;">浏览</a></li>
    </ul>
    <div class="user-menu">
      ${user ? `<span>👤 ${escapeHtml(user.username)}</span><button class="btn btn-secondary" onclick="logout()">退出</button>` : `<button class="btn btn-primary" onclick="renderRegister()">创建账号</button>`}
    </div>
  </nav>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function renderHome() {
  document.getElementById('root').innerHTML = `${nav()}
    <main class="page-shell">
      <div class="search-bar"><div class="search-container">
        <input id="searchKeyword" placeholder="搜索照片...">
        <select id="searchSort"><option value="">排序方式</option><option value="downloads">最多下载</option><option value="rating">评分最高</option><option value="views">最多浏览</option></select>
        <button class="btn btn-primary" onclick="performSearch()">搜索</button>
      </div></div>
      <section class="hero"><h1>欢迎来到自由图片库</h1><p>免费、无广告的图片视频素材库</p><button class="btn btn-primary" onclick="renderExplore()">开始浏览</button></section>
    </main>${uploadFab()}`;
}

async function renderExplore() {
  document.getElementById('root').innerHTML = `${nav()}<main class="page-shell">
    <div class="search-bar"><div class="search-container"><input id="searchKeyword" placeholder="搜索照片..."><select id="searchSort"><option value="">排序方式</option><option value="downloads">最多下载</option><option value="rating">评分最高</option><option value="views">最多浏览</option></select><button class="btn btn-primary" onclick="performSearch()">搜索</button></div></div>
    <div id="photosContainer" class="loading"><div class="spinner"></div><p>加载中...</p></div>
  </main>${uploadFab()}`;
  await loadPhotos();
}

function uploadFab() {
  return `<button class="upload-fab" aria-label="上传图片" title="上传图片" onclick="openUpload()">＋</button>`;
}

async function loadPhotos(keyword = '', sort = '') {
  const container = document.getElementById('photosContainer');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';
  try { displayPhotos(await searchPhotos(keyword, '', sort)); }
  catch (error) { container.innerHTML = `<p class="error-text">加载失败：${escapeHtml(error.message)}</p>`; }
}

function displayPhotos(photos) {
  const container = document.getElementById('photosContainer');
  if (!photos || !photos.length) { container.innerHTML = '<p class="empty-text">没有找到照片</p>'; return; }
  container.className = 'photos-grid';
  container.innerHTML = photos.map(photo => {
    const src = photo.filepath && photo.filepath.startsWith('http') ? photo.filepath : `/${String(photo.filepath || '').replace(/^\//, '')}`;
    return `<article class="photo-card" onclick="viewPhoto('${photo._id}')"><img src="${src}" alt="${escapeHtml(photo.title)}" onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'"><div class="info"><div class="title">${escapeHtml(photo.title)}</div><div class="uploader">📝 ${escapeHtml(photo.uploader?.username || '匿名用户')}</div><div class="stats"><span>👁️ ${photo.views || 0}</span><span>⬇️ ${photo.downloads || 0}</span><span class="rating">⭐ ${Number(photo.averageRating || 0).toFixed(1)}</span></div></div></article>`;
  }).join('');
}

async function performSearch() {
  await loadPhotos(document.getElementById('searchKeyword')?.value.trim() || '', document.getElementById('searchSort')?.value || '');
}

async function viewPhoto(photoId) {
  try {
    const photo = await getPhoto(photoId);
    const src = photo.filepath && photo.filepath.startsWith('http') ? photo.filepath : `/${String(photo.filepath || '').replace(/^\//, '')}`;
    const modal = document.createElement('div'); modal.className = 'modal show';
    modal.innerHTML = `<div class="modal-content"><span class="modal-close" onclick="this.closest('.modal').remove()">×</span><h2>${escapeHtml(photo.title)}</h2><p>📝 ${escapeHtml(photo.uploader?.username || '匿名用户')}</p><img src="${src}" alt="${escapeHtml(photo.title)}" class="detail-image"><p>${escapeHtml(photo.description || '暂无描述')}</p><div class="photo-detail-stats">👁️ ${photo.views || 0}　⬇️ ${photo.downloads || 0}　⭐ ${Number(photo.averageRating || 0).toFixed(1)}</div><button class="btn btn-primary" onclick="downloadPhoto('${photo._id}')">⬇️ 下载照片</button></div>`;
    document.getElementById('root').appendChild(modal);
  } catch (error) { alert('加载失败：' + error.message); }
}

function renderRegister() {
  document.getElementById('root').innerHTML = `<div class="account-page"><div class="account-card"><h2>创建账号</h2><p class="muted">只需输入用户名，无需邮箱和密码。</p><form onsubmit="submitRegister(event)"><div class="form-group"><label for="registerUsername">用户名</label><input id="registerUsername" maxlength="30" placeholder="你的用户名" required autofocus></div><button class="btn btn-primary" type="submit">创建账号</button><button class="btn btn-secondary back-button" type="button" onclick="renderHome()">返回首页</button></form></div></div>`;
}

async function submitRegister(event) {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  if (!username) return;
  try { await enterAsGuest(username); alert('账号创建成功！'); renderHome(); }
  catch (error) { alert('创建账号失败：' + error.message); }
}

function openUpload() {
  if (!getToken()) { renderRegister(); return; }
  renderUpload();
}

function renderUpload() {
  document.getElementById('root').innerHTML = `${nav()}<main class="account-page"><div class="account-card upload-card"><h2>上传图片</h2><form onsubmit="submitUpload(event)"><div class="form-group"><label for="photoFile">图片文件 *</label><input type="file" id="photoFile" accept="image/*" required></div><div class="form-group"><label for="photoTitle">图片标题 *</label><input id="photoTitle" placeholder="给图片起个名字" required></div><div class="form-group"><label for="photoDescription">描述</label><textarea id="photoDescription" placeholder="描述你的图片"></textarea></div><div class="form-group"><label for="photoCategory">分类</label><select id="photoCategory"><option value="">选择分类</option><option>风景</option><option>人物</option><option>建筑</option><option>动物</option><option>其他</option></select></div><div class="form-group"><label for="photoTags">标签</label><input id="photoTags" placeholder="风景, 自然, 户外"></div><button class="btn btn-primary" type="submit">上传到图片库</button><button class="btn btn-secondary back-button" type="button" onclick="renderHome()">取消</button></form></div></main>`;
}

async function submitUpload(event) {
  event.preventDefault();
  const file = document.getElementById('photoFile').files[0];
  const title = document.getElementById('photoTitle').value.trim();
  if (!file || !title) { alert('请填写图片文件和标题'); return; }
  const formData = new FormData();
  formData.append('photo', file); formData.append('title', title);
  formData.append('description', document.getElementById('photoDescription').value.trim());
  formData.append('category', document.getElementById('photoCategory').value);
  formData.append('tags', document.getElementById('photoTags').value);
  try { await uploadPhoto(formData); alert('上传成功！'); renderExplore(); }
  catch (error) { alert('上传失败：' + error.message); }
}

function logout() { if (confirm('确认退出当前账号？')) { clearGuest(); renderHome(); } }
document.addEventListener('DOMContentLoaded', renderHome);
