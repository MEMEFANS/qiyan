const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const DATA_FILE = "/tmp/data.json";
const BOOKINGS_FILE = "/tmp/bookings.json";

// 安全配置：建议通过环境变量设置
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 登录失败限制 (注意：Vercel Serverless 环境下 Map 会在实例销毁时重置)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

// 初始化数据文件 (Vercel 临时目录)
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon"
};

const safeJoin = (base, target) => {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  console.log(`${req.method} ${urlPath}`);
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = safeJoin(root, "." + rel);

  // Vercel Serverless 环境下，如果不是 API 请求且文件不存在，返回 404
  if (!urlPath.startsWith("/api/") && !fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  // 1. 设置基础安全响应头
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net; img-src 'self' data: https://www.transparenttextures.com;");

  // 2. 限制访问敏感文件
  const sensitiveFiles = [
    "package.json",
    "package-lock.json",
    "server.js",
    ".gitignore",
    "README.md"
  ];
  const fileName = path.basename(filePath);
  if (sensitiveFiles.includes(fileName) || fileName.startsWith(".")) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden: Access to this file is restricted.");
    return;
  }

  // 3. 处理登录 API
  if (urlPath === "/api/login" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body);
        const ip = req.socket.remoteAddress;
        
        // 检查是否被锁定
        const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
        if (attempts.count >= MAX_ATTEMPTS && Date.now() - attempts.lastAttempt < LOCK_TIME) {
          res.writeHead(429, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(JSON.stringify({ success: false, message: "Too many attempts. Please try again later." }));
          return;
        }

        // 使用环境变量中的凭据进行校验
        // 注意：此处为了演示修复，使用了基本的字符串比对。
        // 在实际生产中，ADMIN_PASSWORD 应存储为哈希值，并使用 crypto.timingSafeEqual 进行比对。
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          // 登录成功，重置失败次数
          loginAttempts.delete(ip);
          
          res.writeHead(200, {
            "Set-Cookie": "admin_session=authenticated; Path=/; HttpOnly; SameSite=Strict",
            "Content-Type": "application/json"
          });
          res.end(JSON.stringify({ success: true }));
        } else {
          // 登录失败，记录次数
          attempts.count++;
          attempts.lastAttempt = Date.now();
          loginAttempts.set(ip, attempts);
          
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, message: "Invalid credentials" }));
        }
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Bad Request" }));
      }
    });
    return;
  }

  // 4. 处理退出登录 API
  if (urlPath === "/api/logout" && req.method === "POST") {
    res.writeHead(200, {
      "Set-Cookie": "admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
      "Content-Type": "application/json"
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 5. 内容管理接口 (CMS API)
  if (urlPath === "/api/content") {
    if (req.method === "GET") {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
      return;
    }
    if (req.method === "POST") {
      // 检查权限
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Unauthorized" }));
        return;
      }

      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          fs.writeFileSync(DATA_FILE, body);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, message: "Save failed" }));
        }
      });
      return;
    }
  }

  // 6. 预约接口 (Booking API)
  if (urlPath === "/api/book" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const booking = JSON.parse(body);
        booking.id = Date.now();
        booking.createdAt = new Date().toISOString();
        
        const bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
        bookings.push(booking);
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Bad Request" }));
      }
    });
    return;
  }

  // 7. 获取预约列表接口 (仅管理员)
  if (urlPath === "/api/bookings" && req.method === "GET") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("admin_session=authenticated")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Unauthorized" }));
      return;
    }
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
    return;
  }

  // 8. 后台页面权限检查
  if (urlPath.startsWith("/admin/dashboard.html")) {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("admin_session=authenticated")) {
      res.writeHead(302, { "Location": "/admin/login.html" });
      res.end();
      return;
    }
  }

  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
});

module.exports = server;

if (require.main === module) {
  server.listen(port, "127.0.0.1", () => {
    console.log(`Server running: http://localhost:${port}`);
  });
}
