const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const port = Number(process.env.PORT || 3000);

// 数据持久化目录
const DATA_DIR = root; // 直接保存在根目录，避免路径混乱
const DATA_FILE = path.join(DATA_DIR, "data.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const CASES_FILE = path.join(DATA_DIR, "cases.json");

// 安全配置
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 初始化数据文件
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

const serverHandler = (req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const requestOrigin = req.headers.origin;

  // 统一处理响应头的助手函数
  const sendJsonResponse = (statusCode, data, origin) => {
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Credentials": "true",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    res.writeHead(statusCode, headers);
    res.end(JSON.stringify(data));
  };

  try {
    // CORS 预检请求处理
    if (req.method === "OPTIONS") {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": requestOrigin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
      });
      res.end();
      return;
    }

    // --- API 路由处理 ---

    // 1. 登录 API
    if (urlPath === "/api/login" && req.method === "POST") {
      let body = [];
      req.on("data", chunk => { body.push(chunk); });
      req.on("end", () => {
        try {
          const { username, password } = JSON.parse(Buffer.concat(body).toString());
          if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Origin": requestOrigin || "*",
              "Set-Cookie": "admin_session=authenticated; Path=/; HttpOnly; SameSite=Lax"
            });
            res.end(JSON.stringify({ success: true }));
          } else {
            sendJsonResponse(401, { success: false, message: "Invalid credentials" }, requestOrigin);
          }
        } catch (e) {
          sendJsonResponse(400, { success: false, message: "Invalid JSON" }, requestOrigin);
        }
      });
      return;
    }

    // 2. 退出登录 API
    if (urlPath === "/api/logout" && req.method === "POST") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": requestOrigin || "*",
        "Set-Cookie": "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
      });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 3. 内容管理接口 (CMS API)
    if (urlPath === "/api/content") {
      if (req.method === "GET") {
        try {
          const data = fs.readFileSync(DATA_FILE, "utf-8");
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": requestOrigin || "*",
            "Access-Control-Allow-Credentials": "true"
          });
          res.end(data);
        } catch (e) {
          sendJsonResponse(200, {}, requestOrigin);
        }
        return;
      }
      if (req.method === "POST") {
        const cookies = req.headers.cookie || "";
        if (!cookies.includes("admin_session=authenticated")) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            fs.writeFileSync(DATA_FILE, body);
            sendJsonResponse(200, { success: true }, requestOrigin);
          } catch (e) {
            sendJsonResponse(500, { success: false, message: "Save failed" }, requestOrigin);
          }
        });
        return;
      }
    }

    // 4. 预约接口
    if (urlPath === "/api/book" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const booking = JSON.parse(body);
          booking.id = Date.now();
          booking.createdAt = new Date().toISOString();
          let bookings = [];
          try { bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8")); } catch(e){}
          bookings.push(booking);
          fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
          sendJsonResponse(200, { success: true }, requestOrigin);
        } catch (e) {
          sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
        }
      });
      return;
    }

    // 5. 获取预约列表
    if (urlPath === "/api/bookings" && req.method === "GET") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      try {
        const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": requestOrigin || "*",
          "Access-Control-Allow-Credentials": "true"
        });
        res.end(data);
      } catch (e) {
        sendJsonResponse(200, [], requestOrigin);
      }
      return;
    }

    // 6. 康复案例接口
    if (urlPath === "/api/cases") {
      if (req.method === "GET") {
        try {
          const data = fs.readFileSync(CASES_FILE, "utf-8");
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": requestOrigin || "*",
            "Access-Control-Allow-Credentials": "true"
          });
          res.end(data);
        } catch (e) {
          sendJsonResponse(200, [], requestOrigin);
        }
        return;
      }
      if (req.method === "POST") {
        const cookies = req.headers.cookie || "";
        if (!cookies.includes("admin_session=authenticated")) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const newCase = JSON.parse(body);
            let cases = [];
            try { cases = JSON.parse(fs.readFileSync(CASES_FILE, "utf-8")); } catch(e){}
            const index = cases.findIndex(c => c.id === newCase.id);
            if (index >= 0) cases[index] = newCase;
            else cases.push(newCase);
            fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2));
            sendJsonResponse(200, { success: true }, requestOrigin);
          } catch (e) {
            sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
          }
        });
        return;
      }
    }

    // 7. 图片上传接口 (自有服务器直接存 assets)
    if (urlPath === "/api/upload" && req.method === "POST") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const { imageData, fileName, folder } = JSON.parse(body);
          const uploadDir = path.join(root, "assets", folder || "uploads");
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(base64Data, "base64"));
          sendJsonResponse(200, { success: true, path: `/assets/${folder || "uploads"}/${fileName}` }, requestOrigin);
        } catch (e) {
          sendJsonResponse(500, { success: false, message: "Upload failed" }, requestOrigin);
        }
      });
      return;
    }

    // --- 静态文件处理 ---
    const rel = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = safeJoin(root, "." + rel);

    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
    }

  } catch (err) {
    console.error(err);
    sendJsonResponse(500, { success: false, message: "Internal Server Error" }, requestOrigin);
  }
};

const server = http.createServer(serverHandler);

module.exports = serverHandler;

if (require.main === module) {
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running: http://localhost:${port}`);
  });
}
