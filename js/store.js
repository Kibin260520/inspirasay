/* 数据状态 + 与 GitHub 私有仓库同步
   数据仓库（Private，如 inspirasay-data）内数据结构：
   xiaolingganshuo/meta.json            { inspirations: [...], fragments: [...], words: [...], tips: [...], photos: [...] }
   xiaolingganshuo/novels/{id}.json     { id, title, desc, updatedAt, chapters: [...] }
   xiaolingganshuo/graphs/{id}.json     { id, title, type, updatedAt, nodes: [{id,label,x,y,color}], edges: [{a,b}] }
   xiaolingganshuo/photos/{id}.jpg      照片本体（元数据存 meta.json 的 photos 数组）
   公开代码仓库仅存网页本体，不含任何用户数据；照片经 API 带 Token 读取
*/
const DATA_DIR = 'xiaolingganshuo';

const Store = {
  gh: null,
  account: { user: '', repo: '' },
  metaSha: null,
  novelShas: {},
  graphShas: {},
  inspirations: [],
  fragments: [],
  words: [],
  tips: [],
  novels: [],
  graphs: [],
  photos: [],

  async init(user, repo, token) {
    this.gh = new GitHubClient(user, repo, token);
    this.account = { user, repo };
    await this.gh.checkRepo();
  },

  async loadAll() {
    let meta = await this.gh.getJSON(DATA_DIR + '/meta.json');
    /* 空数据仓库首次登录：自动初始化清单，无需手动创建任何文件 */
    if (!meta.data) {
      await this.gh.putJSON(
        DATA_DIR + '/meta.json',
        { inspirations: [], fragments: [], words: [], tips: [], photos: [] },
        null,
        '小灵感说: 初始化数据仓库'
      );
      meta = await this.gh.getJSON(DATA_DIR + '/meta.json');
    }
    this.metaSha = meta.sha;
    this.inspirations = (meta.data && meta.data.inspirations) || [];
    this.fragments = (meta.data && meta.data.fragments) || [];
    this.words = (meta.data && meta.data.words) || [];
    this.tips = (meta.data && meta.data.tips) || [];
    this.photos = (meta.data && meta.data.photos) || [];

    this.novels = [];
    this.novelShas = {};
    const files = await this.gh.listDir(DATA_DIR + '/novels');
    for (const f of files) {
      if (!f.name.endsWith('.json')) continue;
      const one = await this.gh.getJSON(DATA_DIR + '/novels/' + f.name);
      if (one.data) {
        this.novelShas[one.data.id] = one.sha;
        this.novels.push(one.data);
      }
    }
    this.novels.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    this.graphs = [];
    this.graphShas = {};
    const gfiles = await this.gh.listDir(DATA_DIR + '/graphs');
    for (const f of gfiles) {
      if (!f.name.endsWith('.json')) continue;
      const one = await this.gh.getJSON(DATA_DIR + '/graphs/' + f.name);
      if (one.data) {
        this.graphShas[one.data.id] = one.sha;
        this.graphs.push(one.data);
      }
    }
    this.graphs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  async saveMeta() {
    this.metaSha = await this.gh.putJSON(
      DATA_DIR + '/meta.json',
      {
        inspirations: this.inspirations,
        fragments: this.fragments,
        words: this.words,
        tips: this.tips,
        photos: this.photos
      },
      this.metaSha
    );
  },

  async saveNovel(novel) {
    novel.updatedAt = Date.now();
    const path = DATA_DIR + '/novels/' + novel.id + '.json';
    this.novelShas[novel.id] = await this.gh.putJSON(path, novel, this.novelShas[novel.id]);
  },

  async deleteNovel(novel) {
    const path = DATA_DIR + '/novels/' + novel.id + '.json';
    try {
      await this.gh.deleteFile(path, this.novelShas[novel.id]);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    delete this.novelShas[novel.id];
    this.novels = this.novels.filter(n => n.id !== novel.id);
  },

  novelById(id) { return this.novels.find(n => n.id === id) || null; },

  async saveGraph(graph) {
    graph.updatedAt = Date.now();
    const path = DATA_DIR + '/graphs/' + graph.id + '.json';
    this.graphShas[graph.id] = await this.gh.putJSON(path, graph, this.graphShas[graph.id]);
  },

  async deleteGraph(graph) {
    const path = DATA_DIR + '/graphs/' + graph.id + '.json';
    try {
      await this.gh.deleteFile(path, this.graphShas[graph.id]);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    delete this.graphShas[graph.id];
    this.graphs = this.graphs.filter(x => x.id !== graph.id);
  },

  graphById(id) { return this.graphs.find(x => x.id === id) || null; },

  /** 上传照片（dataUrl 为 canvas 导出的 DataURL），先传图片文件再写元数据 */
  async uploadPhoto(name, dataUrl, tag) {
    const id = this.uid();
    const path = DATA_DIR + '/photos/' + id + '.jpg';
    const sha = await this.gh.putFileB64(path, dataUrl.split(',')[1]);
    const photo = {
      id, name: name || '未命名', sha,
      tag: (tag || '').trim(),
      createdAt: Date.now()
    };
    this.photos.unshift(photo);
    await this.saveMeta();
    return photo;
  },

  /** 删除照片：删图片文件（忽略 404）+ 移除元数据 */
  async deletePhoto(photo) {
    try {
      await this.gh.deleteFile(DATA_DIR + '/photos/' + photo.id + '.jpg', photo.sha);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    this.photos = this.photos.filter(x => x.id !== photo.id);
    await this.saveMeta();
  },

  photoById(id) { return this.photos.find(x => x.id === id) || null; },

  /** 照片加载：私有仓库无 CDN 直链，统一走 API 带 Token 拉 blob */
  photoBlob(photo) { return this.gh.fetchRaw(DATA_DIR + '/photos/' + photo.id + '.jpg'); },

  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};
