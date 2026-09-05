// 渲染首页
function renderHome() {
  const root = document.getElementById('root');
  const token = getToken();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  root.innerHTML = `
    <nav class="navbar">
      <div class="logo">📸 自由图片库</div>
      <ul class="nav-links">
        <li><a href="#" onclick="renderHome(); return false;">首页</a></li>
        <li><a href="#" onclick="renderExplore(); return false;">浏览</a></li>
        ${token ? `<li><a href="#" onclick="renderUpload(); return false;">上传</a></li>` : ''}
      </ul>
      <div class="user-menu">
        ${token ? `
          <span>👤 ${user?.username || '用户'}</span>
          <button class="btn btn-secondary" onclick="logout()">退出</button>
        ` : `
          <button class="btn btn-primary" onclick="renderLogin()">登录</button>
          <button class="btn btn-secondary" onclick="renderRegister()">注册</button>
        `}
      </div>
    </nav>

    <div style="max-width: 1200px; margin: 2rem auto; padding: 0 1rem;">
      <div class="search-bar">
        <div class="search-container">
          <input type="text" id="searchKeyword" placeholder="搜索照片...">
          <select id="searchSort">
            <option value="">排序方式</option>
            <option value="downloads">最多下载</option>
            <option value="rating">评分最高</option>
            <option value="views">最多浏览</option>
          </select>
          <button class="btn btn-primary" onclick="performSearch()">搜索</button>
        </div>
      </div>

      <div style="text-align: center; padding: 3rem 0;">
        <h1>欢迎来到自由图片库</h1>
        <p style="color: #666; margin-top: 1rem; font-size: 1.1rem;">免费、无广告、无需注册的图片视频素材库</p>
        <button class="btn btn-primary" style="margin-top: 2rem; padding: 1rem 2rem; font-size: 1.1rem;" onclick="renderExplore()">开始浏览</button>
      </div>
    </div>
  `;
}

// 渲染浏览页面
async function renderExplore() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <nav class="navbar">
      <div class="logo">📸 自由图片库</div>
      <ul class="nav-links">
        <li><a href="#" onclick="renderHome(); return false;">首页</a></li>
        <li><a href="#" onclick="renderExplore(); return false;">浏览</a></li>
        ${getToken() ? `<li><a href="#" onclick="renderUpload(); return false;">上传</a></li>` : ''}
      </ul>
      <div class="user-menu">
        ${getToken() ? `
          <span>👤 ${JSON.parse(localStorage.getItem('user') || '{}').username || '用户'}</span>
          <button class="btn btn-secondary" onclick="logout()">退出</button>
        ` : `
          <button class="btn btn-primary" onclick="renderLogin()">登录</button>
          <button class="btn btn-secondary" onclick="renderRegister()">注册</button>
        `}
      </div>
    </nav>

    <div style="max-width: 1200px; margin: 2rem auto; padding: 0 1rem;">
      <div class="search-bar">
        <div class="search-container">
          <input type="text" id="searchKeyword" placeholder="搜索照片...">
          <select id="searchSort">
            <option value="">排序方式</option>
            <option value="downloads">最多下载</option>
            <option value="rating">评分最高</option>
            <option value="views">最多浏览</option>
          </select>
          <button class="btn btn-primary" onclick="performSearch()">搜索</button>
        </div>
      </div>

      <div id="photosContainer" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </div>
  `;

  try {
    const photos = await searchPhotos();
    displayPhotos(photos);
  } catch (error) {
    document.getElementById('photosContainer').innerHTML = `<p style="color: red;">加载失败: ${error.message}</p>`;
  }
}

// 显示照片
function displayPhotos(photos) {
  const container = document.getElementById('photosContainer');
  
  if (!photos || photos.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">没有找到照片</p>';
    return;
  }

  container.className = 'photos-grid';
  container.innerHTML = photos.map(photo => `
    <div class="photo-card" onclick="viewPhoto('${photo._id}')">
      <img src="${photo.filepath}" alt="${photo.title}" onerror="this.src='https://via.placeholder.com/250x200?text=No+Image'">
      <div class="info">
        <div class="title">${photo.title}</div>
        <div class="uploader">📝 ${photo.uploader?.username || '匿名用户'}</div>
        <div class="stats">
          <span>👁️ ${photo.views}</span>
          <span>⬇️ ${photo.downloads}</span>
          <span class="rating">⭐ ${photo.averageRating?.toFixed(1) || '0'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// 执行搜索
async function performSearch() {
  const keyword = document.getElementById('searchKeyword')?.value || '';
  const sort = document.getElementById('searchSort')?.value || '';
  
  document.getElementById('photosContainer').innerHTML = `
    <div class="loading" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <p>搜索中...</p>
    </div>
  `;

  try {
    const photos = await searchPhotos(keyword, '', sort);
    displayPhotos(photos);
  } catch (error) {
    document.getElementById('photosContainer').innerHTML = `<p style="color: red; grid-column: 1/-1;">搜索失败: ${error.message}</p>`;
  }
}

// 查看照片详情
async function viewPhoto(photoId) {
  try {
    const photo = await getPhoto(photoId);
    const comments = await getComments(photoId);

    const root = document.getElementById('root');
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close" onclick="this.closest('.modal').remove()">×</span>
        
        <h2>${photo.title}</h2>
        <p style="color: #666; margin-bottom: 1rem;">📝 ${photo.uploader?.username || '匿名用户'}</p>
        
        <img src="${photo.filepath}" alt="${photo.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 4px; margin-bottom: 1rem;" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        
        <p>${photo.description || '暂无描述'}</p>
        
        <div style="margin: 1rem 0;">
          <span style="margin-right: 2rem;">👁️ 浏览: ${photo.views}</span>
          <span style="margin-right: 2rem;">⬇️ 下载: ${photo.downloads}</span>
          <span>⭐ 评分: ${photo.averageRating?.toFixed(1) || '0'}/5 (${photo.ratingCount || 0}人)</span>
        </div>
        
        <button class="btn btn-primary" onclick="downloadPhoto('${photo._id}')">⬇️ 下载照片</button>
        
        ${getToken() ? `
          <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem;">
            <h3>评分</h3>
            <div class="rating-stars" id="ratingStars">
              ${[1, 2, 3, 4, 5].map(i => `
                <span class="star" onclick="submitRating('${photo._id}', ${i})" data-score="${i}">★</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="comments-section">
          <h3>评论 (${comments.length})</h3>
          ${comments.map(comment => `
            <div class="comment">
              <div class="comment-author">👤 ${comment.author?.username || '匿名用户'}</div>
              <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
              <div class="comment-content">${comment.content}</div>
              ${getToken() && JSON.parse(localStorage.getItem('user') || '{}').id === comment.author?._id ? `
                <button class="btn btn-danger" style="margin-top: 0.5rem; padding: 0.4rem 0.8rem; font-size: 0.9rem;" onclick="deleteComment('${comment._id}')">删除</button>
              ` : ''}
            </div>
          `).join('')}
          
          ${getToken() ? `
            <div style="margin-top: 1rem;">
              <textarea id="commentInput" placeholder="写下你的评论..." style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; min-height: 80px;"></textarea>
              <button class="btn btn-primary" style="margin-top: 0.5rem;" onclick="submitComment('${photo._id}')">发布评论</button>
            </div>
          ` : `
            <p style="color: #999; margin-top: 1rem;"><a href="#" onclick="renderLogin(); return false;">登录</a>后可以评论</p>
          `}
        </div>
      </div>
    `;
    root.appendChild(modal);
  } catch (error) {
    alert('加载失败: ' + error.message);
  }
}

// 提交评分
async function submitRating(photoId, score) {
  try {
    await ratePhoto(photoId, score);
    alert('评分成功！');
    // 更新星星显示
    document.querySelectorAll('#ratingStars .star').forEach((star, index) => {
      if (index < score) {
        star.classList.add('filled');
      } else {
        star.classList.remove('filled');
      }
    });
  } catch (error) {
    alert('评分失败: ' + error.message);
  }
}

// 提交评论
async function submitComment(photoId) {
  const content = document.getElementById('commentInput').value.trim();
  if (!content) {
    alert('评论不能为空');
    return;
  }

  try {
    await addComment(photoId, content);
    alert('评论成功！');
    viewPhoto(photoId); // 刷新详情页
  } catch (error) {
    alert('评论失败: ' + error.message);
  }
}

// 删除评论
async function deleteComment(commentId) {
  if (!confirm('确认删除此评论？')) return;
  try {
    await deleteComment(commentId);
    alert('删除成功');
    location.reload();
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
}

// 渲染上传页面
function renderUpload() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <nav class="navbar">
      <div class="logo">📸 自由图片库</div>
      <ul class="nav-links">
        <li><a href="#" onclick="renderHome(); return false;">首页</a></li>
        <li><a href="#" onclick="renderExplore(); return false;">浏览</a></li>
        <li><a href="#" onclick="renderUpload(); return false;">上传</a></li>
      </ul>
      <div class="user-menu">
        <span>👤 ${JSON.parse(localStorage.getItem('user') || '{}').username || '用户'}</span>
        <button class="btn btn-secondary" onclick="logout()">退出</button>
      </div>
    </nav>

    <div style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
      <h2>上传照片</h2>
      <form id="uploadForm" style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div class="form-group">
          <label>照片文件 *</label>
          <input type="file" id="photoFile" accept="image/*" required>
        </div>
        <div class="form-group">
          <label>照片标题 *</label>
          <input type="text" id="photoTitle" placeholder="给你的照片起个名字" required>
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea id="photoDescription" placeholder="描述你的照片"></textarea>
        </div>
        <div class="form-group">
          <label>分类</label>
          <select id="photoCategory">
            <option value="">选择分类</option>
            <option value="风景">风景</option>
            <option value="人物">人物</option>
            <option value="建筑">建筑</option>
            <option value="动物">动物</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label>标签 (用逗号分隔)</label>
          <input type="text" id="photoTags" placeholder="如: 风景, 自然, 户外">
        </div>
        <button type="button" class="btn btn-primary" onclick="submitUpload()">上传照片</button>
      </form>
    </div>
  `;
}

// 提交上传
async function submitUpload() {
  const photoFile = document.getElementById('photoFile').files[0];
  const photoTitle = document.getElementById('photoTitle').value.trim();
  const photoDescription = document.getElementById('photoDescription').value.trim();
  const photoCategory = document.getElementById('photoCategory').value;
  const photoTags = document.getElementById('photoTags').value;

  if (!photoFile || !photoTitle) {
    alert('请填写必填项');
    return;
  }

  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('title', photoTitle);
  formData.append('description', photoDescription);
  formData.append('category', photoCategory);
  formData.append('tags', photoTags);

  try {
    await uploadPhoto(formData);
    alert('上传成功！');
    renderHome();
  } catch (error) {
    alert('上传失败: ' + error.message);
  }
}

// 渲染登录页面
function renderLogin() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="max-width: 400px; margin: 4rem auto; padding: 0 1rem;">
      <h2 style="text-align: center; margin-bottom: 2rem;">登录</h2>
      <form style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" id="loginEmail" placeholder="你的邮箱" required>
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="loginPassword" placeholder="你的密码" required>
        </div>
        <button type="button" class="btn btn-primary" style="width: 100%;" onclick="submitLogin()">登录</button>
        <p style="text-align: center; margin-top: 1rem;">还没有账户？<a href="#" onclick="renderRegister(); return false;">注册</a></p>
        <p style="text-align: center;"><a href="#" onclick="renderHome(); return false;">返回首页</a></p>
      </form>
    </div>
  `;
}

// 提交登录
async function submitLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('请填写所有字段');
    return;
  }

  try {
    const data = await login(email, password);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    alert('登录成功！');
    renderHome();
  } catch (error) {
    alert('登录失败: ' + error.message);
  }
}

// 渲染注册页面
function renderRegister() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="max-width: 400px; margin: 4rem auto; padding: 0 1rem;">
      <h2 style="text-align: center; margin-bottom: 2rem;">注册</h2>
      <form style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div class="form-group">
          <label>用户名</label>
          <input type="text" id="registerUsername" placeholder="你的用户名" required>
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" id="registerEmail" placeholder="你的邮箱" required>
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="registerPassword" placeholder="设置密码" required>
        </div>
        <button type="button" class="btn btn-primary" style="width: 100%;" onclick="submitRegister()">注册</button>
        <p style="text-align: center; margin-top: 1rem;">已有账户？<a href="#" onclick="renderLogin(); return false;">登录</a></p>
        <p style="text-align: center;"><a href="#" onclick="renderHome(); return false;">返回首页</a></p>
      </form>
    </div>
  `;
}

// 提交注册
async function submitRegister() {
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!username || !email || !password) {
    alert('请填写所有字段');
    return;
  }

  try {
    const data = await register(username, email, password);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    alert('注册成功！');
    renderHome();
  } catch (error) {
    alert('注册失败: ' + error.message);
  }
}

// 登出
function logout() {
  if (confirm('确认退出登录？')) {
    clearToken();
    renderHome();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', renderHome);