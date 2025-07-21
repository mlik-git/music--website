// 首页和播放页通用脚本
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
    listEl.innerHTML = arr.map((item, idx) => `
      <div class="music-card">
        <img class="music-cover" src="${basePath.img}${item.cover || 'default.png'}" alt="封面">
        <div class="music-title">${item.title}</div>
        <div class="music-artist">${item.artist}</div>
        <div class="music-actions">
          <a class="btn" href="${basePath.player}?file=${encodeURIComponent(item.file)}">播放</a>
          <a class="btn" href="${basePath.audio}${encodeURIComponent(item.file)}" download>下载</a>
        </div>
      </div>
    `).join('');
  }

  renderList(filtered);

  searchInput.addEventListener('input', function() {
    const kw = this.value.trim().toLowerCase();
    filtered = musiclist.filter(item =>
      item.title.toLowerCase().includes(kw) ||
      item.artist.toLowerCase().includes(kw)
    );
    renderList(filtered);
  });
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