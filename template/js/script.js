// 页面加载动画
document.addEventListener('DOMContentLoaded', function() {
  // 创建页面加载动画
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'page-loading';
  loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingDiv);
  
  // 页面加载完成后隐藏加载动画
  window.addEventListener('load', function() {
    setTimeout(() => {
      loadingDiv.style.opacity = '0';
      loadingDiv.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        loadingDiv.remove();
      }, 500);
    }, 300);
  });
  
  // 如果页面已经加载完成，立即隐藏
  if (document.readyState === 'complete') {
    setTimeout(() => {
      loadingDiv.style.opacity = '0';
      loadingDiv.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        loadingDiv.remove();
      }, 500);
    }, 300);
  }
});

// 首页和播放页通用脚本

// --- 收藏功能 ---
// 获取收藏列表
function getFavorites() {
  const favorites = localStorage.getItem('musicFavorites');
  return favorites ? JSON.parse(favorites) : [];
}

// 保存收藏列表
function saveFavorites(favorites) {
  localStorage.setItem('musicFavorites', JSON.stringify(favorites));
}

// 切换收藏状态
function toggleFavorite(file) {
  const favorites = getFavorites();
  const index = favorites.indexOf(file);
  
  if (index > -1) {
    favorites.splice(index, 1); // 取消收藏
  } else {
    favorites.push(file); // 添加收藏
  }
  
  saveFavorites(favorites);
  renderFavorites(); // 重新渲染收藏列表
  
  // 只更新当前收藏按钮的状态，不重新渲染整个音乐列表
  updateFavoriteButton(file, index === -1);
}

// 更新单个收藏按钮状态
function updateFavoriteButton(file, isFavorited) {
  // 找到对应的收藏按钮
  const musicCards = document.querySelectorAll('.music-card');
  musicCards.forEach(card => {
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn && favoriteBtn.onclick.toString().includes(file)) {
      if (isFavorited) {
        favoriteBtn.classList.add('favorited');
        favoriteBtn.title = '取消收藏';
      } else {
        favoriteBtn.classList.remove('favorited');
        favoriteBtn.title = '收藏';
      }
    }
  });
}

// 检查是否已收藏
function isFavorited(file) {
  const favorites = getFavorites();
  return favorites.includes(file);
}

// 渲染收藏列表
function renderFavorites() {
  const favoritesList = document.getElementById('favorites-list');
  if (!favoritesList) return;
  
  const favorites = getFavorites();
  
  if (favorites.length === 0) {
    favoritesList.innerHTML = `
      <div class="favorites-empty">
        <svg viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <p>还没有收藏任何歌曲</p>
        <p style="font-size: 0.8rem; margin-top: 10px; color: #999;">点击歌曲卡片上的心形图标来收藏</p>
      </div>
    `;
    return;
  }
  
  const favoriteSongs = musiclist.filter(song => favorites.includes(song.file));
  
  favoritesList.innerHTML = favoriteSongs.map((item, idx) => `
    <div class="favorite-item" onclick="playFavorite('${item.file}')">
      <div class="favorite-item-title" title="${item.title}">${item.title}</div>
      <div class="favorite-item-artist" title="${item.artist}">${item.artist}</div>
      <div class="favorite-item-actions">
        <a class="btn" href="${basePath.player}?file=${encodeURIComponent(item.file)}">播放</a>
        <button class="btn remove-btn" onclick="event.stopPropagation(); toggleFavorite('${item.file}')" title="取消收藏">×</button>
      </div>
    </div>
  `).join('');
}

// 播放收藏的歌曲
function playFavorite(file) {
  window.location.href = `${basePath.player}?file=${encodeURIComponent(file)}`;
}

// 导出收藏
function exportFavorites() {
  const favorites = getFavorites();
  if (favorites.length === 0) {
    alert('您还没有收藏任何歌曲！');
    return;
  }
  
  const exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    favorites: favorites,
    songDetails: musiclist.filter(song => favorites.includes(song.file))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `音乐收藏_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert(`已导出 ${favorites.length} 首收藏歌曲！`);
}

// 导入收藏
function importFavorites(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      let favorites = [];
      
      if (data.favorites && Array.isArray(data.favorites)) {
        favorites = data.favorites;
      } else if (Array.isArray(data)) {
        favorites = data;
      } else {
        throw new Error('文件格式不正确');
      }
      
      // 验证收藏的歌曲是否存在于当前音乐列表中
      const validFavorites = favorites.filter(file => 
        musiclist.some(song => song.file === file)
      );
      
      if (validFavorites.length === 0) {
        alert('导入的收藏中没有找到匹配的歌曲！');
        return;
      }
      
      // 合并现有收藏和新导入的收藏（去重）
      const currentFavorites = getFavorites();
      const mergedFavorites = [...new Set([...currentFavorites, ...validFavorites])];
      
      saveFavorites(mergedFavorites);
      renderFavorites();
      
      // 更新所有收藏按钮状态，不重新渲染列表
      updateAllFavoriteButtons();
      
      alert(`成功导入 ${validFavorites.length} 首歌曲到收藏！`);
      
    } catch (error) {
      alert('导入失败：文件格式不正确或已损坏！');
      console.error('导入错误:', error);
    }
  };
  
  reader.readAsText(file);
  event.target.value = ''; // 清空文件输入
}

// 更新所有收藏按钮状态
function updateAllFavoriteButtons() {
  const favorites = getFavorites();
  const musicCards = document.querySelectorAll('.music-card');
  
  musicCards.forEach(card => {
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      const file = favoriteBtn.onclick.toString().match(/'([^']+)'/)?.[1];
      if (file) {
        if (favorites.includes(file)) {
          favoriteBtn.classList.add('favorited');
          favoriteBtn.title = '取消收藏';
        } else {
          favoriteBtn.classList.remove('favorited');
          favoriteBtn.title = '收藏';
        }
      }
    }
  });
}

// 清空收藏
function clearFavorites() {
  if (confirm('确定要清空所有收藏吗？此操作不可恢复！')) {
    saveFavorites([]);
    renderFavorites();
    
    // 更新所有收藏按钮状态，不重新渲染列表
    updateAllFavoriteButtons();
    
    alert('收藏已清空！');
  }
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// 根据当前页面位置确定资源的基础路径
const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
const basePath = {
  img: isIndexPage ? 'img/' : '../img/',
  audio: isIndexPage ? 'audio/' : '../audio/',
  player: isIndexPage ? 'template/player.html' : 'player.html' 
};

// --- 歌词处理 ---
// 将此函数移至全局作用域，以确保动态加载的歌词脚本总能找到它
function loadLyricCallback(text) {
  if (window.currentLyricCallback) {
    window.currentLyricCallback(text);
  }
}

// index.html 逻辑
if (document.getElementById('music-list')) {
  const listEl = document.getElementById('music-list');
  const searchInput = document.getElementById('search-input');
  let filtered = musiclist;

  function renderList(arr) {
    listEl.innerHTML = arr.map((item, idx) => {
      const isFav = isFavorited(item.file);
      return `
        <div class="music-card">
          <button class="btn favorite-btn ${isFav ? 'favorited' : ''}" onclick="toggleFavorite('${item.file}')" title="${isFav ? '取消收藏' : '收藏'}">
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <img class="music-cover" src="${basePath.img}${item.cover || 'default.png'}" alt="封面">
          <div class="music-info">
            <div class="music-title">${item.title}</div>
            <div class="music-artist">${item.artist}</div>
          </div>
          <div class="music-actions">
            <a class="btn" href="${basePath.player}?file=${encodeURIComponent(item.file)}">播放</a>
            <a class="btn" href="${basePath.audio}${encodeURIComponent(item.file)}" download>下载</a>
          </div>
        </div>
      `;
    }).join('');
  }

  renderList(filtered);

  // 搜索防抖优化
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    
    // 显示搜索中状态
    const searchBtn = searchInput.nextElementSibling;
    if (searchBtn) {
      searchBtn.textContent = '搜索中...';
      searchBtn.style.opacity = '0.7';
    }
    
    searchTimeout = setTimeout(() => {
      const kw = this.value.trim().toLowerCase();
      filtered = musiclist.filter(item =>
        item.title.toLowerCase().includes(kw) ||
        item.artist.toLowerCase().includes(kw)
      );
      renderList(filtered);
      
      // 恢复搜索按钮状态
      if (searchBtn) {
        searchBtn.textContent = '搜索';
        searchBtn.style.opacity = '1';
      }
      
      // 显示搜索结果数量
      showSearchResult(filtered.length, kw);
    }, 300); // 300ms防抖延迟
  });
  
  // 显示搜索结果统计
  function showSearchResult(count, keyword) {
    let resultDiv = document.getElementById('search-result');
    if (!resultDiv) {
      resultDiv = document.createElement('div');
      resultDiv.id = 'search-result';
      resultDiv.style.cssText = `
        text-align: center;
        margin: 10px 0;
        color: #3a8dde;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      searchInput.parentNode.parentNode.insertBefore(resultDiv, searchInput.parentNode.nextSibling);
    }
    
    if (keyword) {
      resultDiv.textContent = `找到 ${count} 首相关歌曲`;
      resultDiv.style.opacity = '1';
      
      // 2秒后淡出
      setTimeout(() => {
        resultDiv.style.opacity = '0';
      }, 2000);
    } else {
      resultDiv.style.opacity = '0';
    }
  }
  
  // 初始化收藏列表
  renderFavorites();
}

// player.html 逻辑
if (document.getElementById('player-box') || document.querySelector('.player-main')) {
  document.addEventListener('DOMContentLoaded', function() {
    const file = getQueryParam('file');
    const info = musiclist.find(m => m.file === file);
    const audio = document.getElementById('player-audio');
    const cover = document.getElementById('player-cover');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progress = document.getElementById('player-progress');
    const lyricsContainer = document.getElementById('lyrics-container');
    let playing = false;
    let lyrics = [];
    let currentLyricIndex = -1;

    // 渲染歌曲信息
    if (info) {
      cover.src = `${basePath.img}${info.cover || 'default.png'}`;
      document.getElementById('player-title').textContent = info.title;
      document.getElementById('player-artist').textContent = info.artist;
      audio.src = `${basePath.audio}${encodeURIComponent(info.file)}`;
      loadLyrics(info.file);
      if(document.getElementById('player-duration'))
        document.getElementById('player-duration').textContent = info.duration + ' 秒';
    } else {
      document.getElementById('player-title').textContent = '未找到该歌曲';
    }

    // --- 错误处理 ---
    // 音频加载错误处理
    audio.addEventListener('error', function(e) {
      console.error('音频加载失败:', e);
      const errorMessage = document.getElementById('player-title');
      if (errorMessage) {
        errorMessage.textContent = '音频文件加载失败';
        errorMessage.style.color = '#ff6b6b';
      }
      
      // 显示错误提示
      showError('音频文件加载失败，请检查文件是否存在或网络连接');
      
      // 禁用播放按钮
      if (playBtn) {
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
        playBtn.style.cursor = 'not-allowed';
      }
    });

    // 图片加载错误处理
    cover.addEventListener('error', function() {
      console.warn('封面图片加载失败，使用默认图片');
      cover.src = `${basePath.img}default.png`;
    });

    // 显示错误提示函数
    function showError(message) {
      // 创建错误提示元素
      let errorDiv = document.getElementById('error-message');
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.cssText = `
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff6b6b;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          z-index: 1000;
          font-size: 14px;
          max-width: 300px;
          text-align: center;
        `;
        document.body.appendChild(errorDiv);
      }
      
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      
      // 3秒后自动隐藏
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 3000);
    }

    // 网络状态监听
    window.addEventListener('online', function() {
      console.log('网络已连接');
      // 可以在这里重新加载音频
    });

    window.addEventListener('offline', function() {
      console.log('网络已断开');
      showError('网络连接已断开，请检查网络设置');
    });

    // --- 歌词处理 (加载部分) ---
    function loadLyrics(fileName) {
      const lrcFile = fileName.replace(/\.[^/.]+$/, "") + '.lrc.js';
      const lrcPath = `../lyric_js/${lrcFile}`;

      // 移除旧的歌词脚本
      const oldScript = document.getElementById('lyric-script');
      if (oldScript) {
        oldScript.remove();
      }

      window.currentLyricCallback = (text) => {
        if (text) {
          parseLyrics(text);
        } else {
          lyricsContainer.innerHTML = `<p class="lyrics-line" style="text-align: center;">暂无歌词</p>`;
        }
        delete window.currentLyricCallback;
      };

      const script = document.createElement('script');
      script.id = 'lyric-script';
      script.src = lrcPath;
      script.onerror = () => {
        lyricsContainer.innerHTML = `<p class="lyrics-line" style="text-align: center;">暂无歌词</p>`;
      };
      document.body.appendChild(script);
    }

    // --- 歌词处理 (解析部分) ---
    function parseLyrics(text) {
      const lines = text.split('\n');
      let result = [];
      const timeTag = /\[(\d{2}):(\d{2})(?:[\.:](\d{1,3}))?\]/g;
      for (const line of lines) {
        let tags = [...line.matchAll(timeTag)];
        let lyricText = line.replace(timeTag, '').trim();
        for (const tag of tags) {
          const min = parseInt(tag[1], 10);
          const sec = parseInt(tag[2], 10);
          let ms = 0;
          if (tag[3]) {
            ms = tag[3].length === 3 ? parseInt(tag[3], 10) : parseInt(tag[3].padEnd(3, '0'), 10);
          }
          const time = min * 60 + sec + ms / 1000;
          result.push({ time, text: lyricText });
        }
      }
      // 按时间排序，去除空行
      lyrics = result.filter(l => l.text).sort((a, b) => a.time - b.time);
      renderLyrics();
    }

    function renderLyrics() {
      lyricsContainer.innerHTML = lyrics.map((line, index) =>
        `<p class="lyrics-line" data-index="${index}">${line.text || '&nbsp;'}</p>`
      ).join('');
    }

    function updateLyrics(currentTime) {
      if (!lyrics.length) return;

      // 找到当前应高亮的歌词行
      let newLyricIndex = -1;
      // 从后往前找，找到第一个时间小于当前时间的歌词
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (lyrics[i].time <= currentTime) {
          newLyricIndex = i;
          break;
        }
      }

      if (newLyricIndex !== currentLyricIndex) {
        currentLyricIndex = newLyricIndex;
        
        // 更新高亮
        lyricsContainer.querySelectorAll('.lyrics-line.active').forEach(el => {
            el.classList.remove('active');
        });
        
        if (currentLyricIndex !== -1) {
            const activeLine = lyricsContainer.querySelector(`[data-index="${currentLyricIndex}"]`);
            if (activeLine) {
                activeLine.classList.add('active');
                
                // --- 终极诊断与滚动逻辑 ---
                const containerHeight = lyricsContainer.clientHeight;
                const scrollHeight = lyricsContainer.scrollHeight;
                const lineTop = activeLine.offsetTop;
                const lineHeight = activeLine.clientHeight;
                const targetScrollTop = lineTop - containerHeight / 2 + lineHeight / 2;
                
                console.log('--- 滚动诊断 ---');
                console.log(`容器可见高度 (clientHeight): ${containerHeight}`);
                console.log(`容器内容总高 (scrollHeight): ${scrollHeight}`);
                console.log(`当前高亮行offsetTop: ${lineTop}`);
                console.log(`计算目标滚动位置 (targetScrollTop): ${targetScrollTop}`);
                console.log(`滚动前 scrollTop: ${lyricsContainer.scrollTop}`);

                if (scrollHeight > containerHeight) {
                    lyricsContainer.scrollTop = targetScrollTop;
                    console.log(`滚动后 scrollTop: ${lyricsContainer.scrollTop}`);
                } else {
                    console.warn('容器不可滚动 (scrollHeight <= clientHeight)');
                }
                console.log('--- 诊断结束 ---');

            } else {
                // 没有找到对应的DOM元素
                console.warn('未找到高亮行的DOM元素，index:', currentLyricIndex);
            }
        }
        // 额外调试：打印歌词数组和DOM行数
        console.log('歌词数组:', lyrics);
        console.log('DOM行数:', lyricsContainer.querySelectorAll('.lyrics-line').length);
    }
}

// 移除独立的、带防抖的 checkAndScrollLyrics 函数

// --- 歌词处理结束 ---

// 旋转动画控制
    function setDiscRotate(on) {
      if (on) {
        cover.classList.add('rotating');
      } else {
        cover.classList.remove('rotating');
      }
    }

    // 播放/暂停切换
    function togglePlay() {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }
    playBtn && playBtn.addEventListener('click', togglePlay);
    audio.addEventListener('play', () => {
      setDiscRotate(true);
      playIcon.style.display = 'none';
      pauseIcon.style.display = '';
      playing = true;
    });
    audio.addEventListener('pause', () => {
      setDiscRotate(false);
      playIcon.style.display = '';
      pauseIcon.style.display = 'none';
      playing = false;
    });

    // 进度条同步
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        progress.value = (audio.currentTime / audio.duration) * 100;
      }
      updateLyrics(audio.currentTime);
    });
    progress.addEventListener('input', function() {
      if (audio.duration) {
        audio.currentTime = (progress.value / 100) * audio.duration;
      }
    });

    // 切歌功能
    function playByIndex(idx) {
      if (idx < 0) idx = musiclist.length - 1;
      if (idx >= musiclist.length) idx = 0;
      const song = musiclist[idx];
      window.location.href = `${basePath.player}?file=${encodeURIComponent(song.file)}`;
    }
    if (info) {
      const idx = musiclist.findIndex(m => m.file === info.file);
      prevBtn && prevBtn.addEventListener('click', () => playByIndex(idx - 1));
      nextBtn && nextBtn.addEventListener('click', () => playByIndex(idx + 1));
    }
  });
} 

// 菜单栏高亮
(function() {
  var navLinks = document.querySelectorAll('.header nav a');
  var path = window.location.pathname.replace(/\\/g, '/');
  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    var hrefFile = href.split('/').pop();
    var pathFile = path.split('/').pop();
    if (hrefFile === pathFile || (hrefFile === 'index.html' && (pathFile === '' || pathFile === '/'))) {
      link.classList.add('nav-link', 'active');
    } else {
      link.classList.add('nav-link');
    }
  });
})(); 