const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const DATA_FILE = "/tmp/data.json";
const BOOKINGS_FILE = "/tmp/bookings.json";
const CASES_FILE = "/tmp/cases.json";

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
if (!fs.existsSync(CASES_FILE)) fs.writeFileSync(CASES_FILE, "[]");

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

  // CORS 预检请求处理
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin || "*";
    res.writeHead(200, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true"
    });
    res.end();
    return;
  }

  // 获取请求来源用于CORS
  const requestOrigin = req.headers.origin || "*";

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
    let body = [];
    req.on("data", chunk => { body.push(chunk); });
    req.on("end", () => {
      try {
        const bodyStr = Buffer.concat(body).toString();
        const { username, password } = JSON.parse(bodyStr);
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": requestOrigin,
            "Access-Control-Allow-Credentials": "true",
            "Set-Cookie": "admin_session=authenticated; Path=/; HttpOnly; SameSite=Lax"
          });
          res.end('{"success":true}');
        } else {
          res.writeHead(401, { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": requestOrigin,
            "Access-Control-Allow-Credentials": "true"
          });
          res.end('{"success":false,"message":"Invalid credentials"}');
        }
      } catch (e) {
        res.writeHead(400, { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": requestOrigin,
          "Access-Control-Allow-Credentials": "true"
        });
        res.end('{"success":false,"message":"Bad Request"}');
      }
    });
    req.on("error", () => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end('{"success":false,"message":"Server Error"}');
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

  // 7b. 康复案例接口 (公开获取)
  if (urlPath === "/api/cases" && req.method === "GET") {
    const data = fs.readFileSync(CASES_FILE, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
    return;
  }

  // 7c. 保存康复案例 (仅管理员)
  if (urlPath === "/api/cases" && req.method === "POST") {
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
        const newCase = JSON.parse(body);
        let cases = JSON.parse(fs.readFileSync(CASES_FILE, "utf-8"));
        const index = cases.findIndex(c => c.id === newCase.id);
        if (index >= 0) {
          cases[index] = newCase;
        } else {
          cases.push(newCase);
        }
        fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Bad Request" }));
      }
    });
    return;
  }

  // 8. 图片上传接口
  if (urlPath === "/api/upload" && req.method === "POST") {
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
        const { imageData, fileName, folder } = JSON.parse(body);
        
        if (!imageData || !fileName) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, message: "Missing data" }));
          return;
        }

        const uploadDir = path.join(root, "assets", folder || "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, path: `/assets/${folder || "uploads"}/${fileName}` }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Upload failed" }));
      }
    });
    return;
  }

  // 9. 获取文件列表接口
  if (urlPath === "/api/files" && req.method === "GET") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("admin_session=authenticated")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Unauthorized" }));
      return;
    }

    const folder = req.headers.folder || "uploads";
    const uploadDir = path.join(root, "assets", folder);
    
    try {
      if (!fs.existsSync(uploadDir)) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([]));
        return;
      }
      
      const files = fs.readdirSync(uploadDir)
        .filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
        .map(f => ({
          name: f,
          path: `/assets/${folder}/${f}`,
          size: fs.statSync(path.join(uploadDir, f)).size
        }));
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(files));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Failed to list files" }));
    }
    return;
  }

  // 10. 后台页面权限检查
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
