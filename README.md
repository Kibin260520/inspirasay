# 小灵感说 (inspirasay)

手机端小说灵感记录工具 —— 纯静态网页（HTML/CSS/原生 JS），无需服务器、无需安装 App。
灵感设定（世界观/人物/技能…）、片段、短词、小说章节、人物关系图谱、照片墙，随时随地记录。

**你的所有创作数据都存放在你自己的 GitHub 私有仓库中**，任何人无法查看或 fork。

## 在线使用

👉 https://kibin260520.github.io/inspirasay/

## 如何部署给自己用（3 步）

> 无需写代码，也不需要手动创建任何数据目录 —— 首次登录会自动初始化。

### 第 1 步：拥有自己的代码

- 方式 A：直接使用上方在线地址（数据仍然是你的，代码只是界面）
- 方式 B：Fork 本仓库到自己账号，然后进入 `Settings → Pages`，选择 `main` 分支部署，得到你自己的网址

### 第 2 步：新建一个私有数据仓库

1. 登录 GitHub → 右上角 `+` → `New repository`
2. 仓库名随意（例如 `inspirasay-data`），可见性选 **Private**
3. 勾选 `Add a README` 初始化即可，**不需要创建任何数据目录或文件**

> 应用会自动在这个仓库里建立 `xiaolingganshuo/` 数据目录（灵感清单、小说、图谱、照片都在里面）。

### 第 3 步：创建访问令牌（Token）

1. GitHub → `Settings → Developer settings → Personal access tokens → Fine-grained tokens` → `Generate new token`
2. **Repository access** 选 `Only select repositories`，勾选第 2 步创建的数据仓库
3. 权限中把 **Contents** 设为 `Read and write`（其余默认）
4. 生成后复制 Token（只显示一次，妥善保存）

### 第 4 步：登录使用

打开网页，在登录页填写：

| 字段 | 填什么 |
|---|---|
| GitHub 用户名 | 你的 GitHub 用户名 |
| 数据仓库名 | 第 2 步创建的私有仓库名 |
| Access Token | 第 3 步生成的令牌 |
| 准备设定的小说 | 你的小说名（必填，登录后显示在「更多」页） |

登录成功后即可使用，数据自动同步到你的私有仓库。

## 常见问题

**Q：换一个数据仓库就是新的一套数据吗？**
是。换个私有仓库名登录，就是一套全新的空数据；换 GitHub 账号 + 对应 Token 才是真正的"另一个账号"。

**Q：Token 会不会泄露？**
Token 只保存在你本机浏览器（localStorage），不会上传到任何第三方；所有请求都是浏览器直连 GitHub API。

**Q：数据怎么备份？**
数据就是 GitHub 仓库里的 JSON 文件和图片，天然有版本历史，可随时在 GitHub 网页上查看或下载。

**Q：别人 Fork 这个代码仓库能拿到我的设定吗？**
不能。代码仓库（公开）里没有任何用户数据，设定全部在你自己的私有仓库里。

## 技术栈

纯 HTML/CSS/原生 JavaScript 单页应用，GitHub Contents API 读写数据，GitHub Pages 托管，无后端、无数据库、无依赖。
