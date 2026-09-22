// 正文先显示轻量提示；隐藏的 pre/code 保留给酒馆助手识别与挂载。
// 不将数 MB 的 Base64 作为可见 Markdown 代码块输出。
function frontendLoader(html, label, attributes = '') {
  const payload = Buffer.from(html).toString('base64');
  const code = `<body><script>$(function(){try{${attributes}$("body").html(new TextDecoder().decode(Uint8Array.from(atob("${payload}"),c=>c.charCodeAt(0))));}catch(error){$("body").text("${label}加载失败："+error.message);}});</script></body>`;
  const escaped = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  return `<div data-embers-shell="${label}"><div data-embers-note role="status" style="padding:18px;border:1px solid #aa937455;background:#1b2829;color:#e5d7bd;font:13px/1.8 sans-serif">正在加载${label}，请稍候…<details><summary>加载帮助</summary>请检查酒馆助手的前端渲染和本卡正则是否已启用。</details></div><div><pre style="display:none!important" aria-hidden="true"><code>${escaped}</code></pre></div></div>`;
}
module.exports = { frontendLoader };
