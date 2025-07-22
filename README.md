# 青蓝音乐站

## 项目简介
青蓝音乐站是一个纯静态、无后端的本地音乐播放与下载网站，支持歌词同步，界面简洁美观，适合个人和小型团队自建音乐库。

## 开源地址
[https://github.com/mlik-git/music--website](https://github.com/mlik-git/music--website)

## 目录结构
```
music-site/
├── audio/                # 存放音乐文件（mp3）
├── img/                  # 存放专辑封面、默认封面
├── lyric/                # 存放歌词文件（.lrc）
├── lyric_js/             # 自动生成的歌词JS文件（勿手动编辑）
├── template/
│   ├── css/styles.css    # 全站样式
│   ├── js/script.js      # 主JS逻辑
│   ├── js/musiclist.js   # 自动生成的音乐列表
│   ├── js/jsmediatags.min.js # MP3元数据解析库
│   ├── about.html        # 关于页面
│   ├── MV.html           # MV页面（暂不开放）
│   ├── player.html       # 播放器页面
│   ├── report.html       # 建议页面
├── index.html            # 首页
├── build.py              # 静态资源生成脚本
├── info.nf               # 项目引导说明
└── README.md             # 项目说明
```

## 如何添加音乐和歌词
1. 将你的mp3文件放入 `audio/` 文件夹。
2. （可选）将同名的 `.lrc` 歌词文件放入 `lyric/` 文件夹。
3. 运行 `python build.py`，自动生成音乐列表和歌词JS文件。
4. 刷新网页即可看到新歌曲和歌词。

## 如何本地预览
- 推荐用浏览器直接打开 `index.html`，所有功能均为纯静态，无需服务器。
- 歌词同步、封面、播放、下载等功能均可在 `file://` 协议下正常使用。

## 主要功能
- 音乐播放、下载、搜索、歌词同步
- 歌词自动滚动高亮，支持多种LRC格式
- 响应式布局，适配手机/平板/PC
- 青蓝色主题，菜单栏高亮，交互细节美观
- 关于、建议、MV（占位）等静态页面

## 技术栈
- HTML + CSS + JavaScript（前端）
- Python（仅用于静态资源生成，不参与前端运行）

## 致谢
- [jsmediatags](https://github.com/aadsm/jsmediatags) 用于解析MP3元数据
- 所有开源字体、图标和灵感来源

---
如有建议或问题，欢迎在“建议”页面留言或通过邮箱联系作者。
