/* GitHub Contents API 封装（浏览器端直连，无后端） */
const GH_API = 'https://api.github.com';

class GitHubClient {
  constructor(owner, repo, token) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

  async request(path, options = {}) {
    const res = await fetch(GH_API + path, {
      method: options.method || 'GET',
      headers: {
        'Authorization': 'Bearer ' + this.token,
        'Accept': 'application/vnd.github+json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options.body
    });
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try {
        const j = await res.json();
        if (j && j.message) msg += ': ' + j.message;
      } catch (_) { /* ignore */ }
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }

  repoPath() { return '/repos/' + this.owner + '/' + this.repo; }

  contentUrl(path) { return this.repoPath() + '/contents/' + path; }

  checkRepo() { return this.request(this.repoPath()); }

  /** 读取仓库中的 JSON 文件，返回 { sha, data }；文件不存在时返回 { sha: null, data: null } */
  async getJSON(path) {
    try {
      const item = await this.request(this.contentUrl(path));
      const bin = Uint8Array.from(atob(item.content.replace(/\s/g, '')), c => c.charCodeAt(0));
      return { sha: item.sha, data: JSON.parse(new TextDecoder().decode(bin)) };
    } catch (e) {
      if (e.status === 404) return { sha: null, data: null };
      throw e;
    }
  }

  /** UTF-8 安全的 Base64 编码 */
  static toB64(str) {
    const bin = Array.from(new TextEncoder().encode(str), b => String.fromCharCode(b)).join('');
    return btoa(bin);
  }

  /** 写入 JSON 文件（带 sha 以实现覆盖更新），返回新 sha */
  async putJSON(path, obj, sha, message) {
    const res = await this.request(this.contentUrl(path), {
      method: 'PUT',
      body: JSON.stringify({
        message: message || '小灵感说: 更新 ' + path,
        content: GitHubClient.toB64(JSON.stringify(obj, null, 2)),
        ...(sha ? { sha } : {})
      })
    });
    return res.content.sha;
  }

  /** 写入二进制文件（传入已编码的 base64 字符串），返回新 sha */
  async putFileB64(path, b64, sha, message) {
    const res = await this.request(this.contentUrl(path), {
      method: 'PUT',
      body: JSON.stringify({
        message: message || '小灵感说: 上传 ' + path,
        content: b64,
        ...(sha ? { sha } : {})
      })
    });
    return res.content.sha;
  }

  /** 仓库内文件的直链（公开仓库可用 raw.githubusercontent） */
  fileUrl(path) {
    return 'https://raw.githubusercontent.com/' + this.owner + '/' + this.repo + '/main/' + path;
  }

  /** jsDelivr CDN 直链（国内访问更快，适合照片这类永不修改的文件） */
  cdnUrl(path) {
    return 'https://cdn.jsdelivr.net/gh/' + this.owner + '/' + this.repo + '@main/' + path;
  }

  /** 通过 API 直接拉取文件内容（blob），作为 CDN 未命中时的兜底 */
  async fetchRaw(path) {
    const res = await fetch(GH_API + this.contentUrl(path), {
      headers: { 'Authorization': 'Bearer ' + this.token, 'Accept': 'application/vnd.github.raw' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.blob();
  }

  async deleteFile(path, sha) {
    await this.request(this.contentUrl(path), {
      method: 'DELETE',
      body: JSON.stringify({ message: '小灵感说: 删除 ' + path, sha })
    });
  }

  /** 列目录，目录不存在时返回空数组 */
  async listDir(path) {
    try { return await this.request(this.contentUrl(path)); }
    catch (e) { if (e.status === 404) return []; throw e; }
  }
}
