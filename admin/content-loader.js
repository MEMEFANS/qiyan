/**
 * Content Loader - reads siteContent from localStorage
 * and replaces text in any element with a matching data-content="key" attribute.
 * Include this script on every frontend page that should reflect admin edits.
 */
(function () {
  const apply = (data) => {
    if (!data || !Object.keys(data).length) return;
    // Generic: any element with data-content="someKey" gets its text replaced
    document.querySelectorAll('[data-content]').forEach(el => {
      const key = el.getAttribute('data-content');
      if (data[key] == null) return;

      // For stat counters, also update data-count so animated numbers work
      if (key.startsWith('stat')) {
        el.setAttribute('data-count', data[key]);
        el.textContent = data[key];
      } else if (el.tagName === 'IMG') {
        el.src = data[key];
      } else {
        // Use innerHTML to support <br> and other formatting
        // Convert newlines to <br> if it's from a textarea
        const val = data[key].toString().replace(/\n/g, '<br>');
        el.innerHTML = val;
      }
    });
  };

  const load = async () => {
      try {
        const res = await fetch('/api/content?t=' + Date.now());
        if (!res.ok) {
          // 如果是 404，说明可能没有启动后端服务，静默退出
          if (res.status === 404) return;
          throw new Error('Failed to load content');
        }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        // 尝试判断是否为有效的 JSON 字符串，如果不是则跳过
        try {
          const data = JSON.parse(text);
          apply(data);
        } catch (e) {
          // 不是 JSON，可能是一个 HTML 错误页，忽略
        }
        return;
      }

      const data = await res.json();
      apply(data);
    } catch (e) {
      // 这里的错误通常是由于没有运行 node server.js 导致的 fetch 失败
      // 在开发环境下或者直接打开 HTML 时是正常的，不需要报错到控制台
    }
  };

  // Expose to global for dynamic content (like footer/header)
  window.contentLoader = {
    refresh: load
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
