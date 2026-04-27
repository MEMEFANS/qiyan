const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const DATA_FILE = "/tmp/data.json";
const BOOKINGS_FILE = "/tmp/bookings.json";
const CASES_FILE = "/tmp/cases.json";

// 安全配置
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");
if (!fs.existsSync(CASES_FILE)) fs.writeFileSync(CASES_FILE, "[]");

module.exports = (req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const requestOrigin = req.headers.origin;

  // 统一处理响应头的助手函数
  const sendJsonResponse = (statusCode, data, origin) => {
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Credentials": "true"
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

    // 3. 处理登录 API
    if (urlPath.endsWith("/login") && req.method === "POST") {
      let body = [];
      req.on("data", chunk => { body.push(chunk); });
      req.on("end", () => {
        try {
          const bodyStr = Buffer.concat(body).toString();
          if (!bodyStr) {
            return sendJsonResponse(400, { success: false, message: "Empty request body" }, requestOrigin);
          }
          const { username, password } = JSON.parse(bodyStr);
          
          if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const headers = {
              "Content-Type": "application/json",
              "Access-Control-Allow-Credentials": "true",
              "Set-Cookie": "admin_session=authenticated; Path=/; HttpOnly; SameSite=Lax"
            };
            if (requestOrigin) headers["Access-Control-Allow-Origin"] = requestOrigin;
            
            res.writeHead(200, headers);
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

    // 4. 处理退出登录 API
    if (urlPath.endsWith("/logout") && req.method === "POST") {
      const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": "true",
        "Set-Cookie": "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
      };
      if (requestOrigin) headers["Access-Control-Allow-Origin"] = requestOrigin;
      res.writeHead(200, headers);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 5. 内容管理接口 (CMS API)
    if (urlPath.endsWith("/content")) {
      if (req.method === "GET") {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(data);
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

    // 6. 预约接口 (Booking API)
    if (urlPath.endsWith("/book") && req.method === "POST") {
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
          sendJsonResponse(200, { success: true }, requestOrigin);
        } catch (e) {
          sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
        }
      });
      return;
    }

    // 7. 获取预约列表接口
    if (urlPath.endsWith("/bookings") && req.method === "GET") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
      return;
    }

    // 7b. 康复案例接口 (公开获取)
    if (urlPath.endsWith("/cases") && req.method === "GET") {
      const data = fs.readFileSync(CASES_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
      return;
    }

    // 7c. 保存康复案例 (仅管理员)
    if (urlPath.endsWith("/cases") && req.method === "POST") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const newCase = JSON.parse(body);
          let cases = JSON.parse(fs.readFileSync(CASES_FILE, "utf-8"));
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

    // 8. 图片上传接口
    if (urlPath.endsWith("/upload") && req.method === "POST") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const { imageData, fileName, folder } = JSON.parse(body);
          if (!imageData || !fileName) {
            return sendJsonResponse(400, { success: false, message: "Missing data" }, requestOrigin);
          }
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

    // 9. 获取文件列表接口
    if (urlPath.endsWith("/files") && req.method === "GET") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      const folder = req.headers.folder || "uploads";
      const uploadDir = path.join(root, "assets", folder);
      try {
        if (!fs.existsSync(uploadDir)) return sendJsonResponse(200, [], requestOrigin);
        const files = fs.readdirSync(uploadDir)
          .filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
          .map(f => ({
            name: f,
            path: `/assets/${folder}/${f}`,
            size: fs.statSync(path.join(uploadDir, f)).size
          }));
        sendJsonResponse(200, files, requestOrigin);
      } catch (e) {
        sendJsonResponse(500, { success: false, message: "Failed to list files" }, requestOrigin);
      }
      return;
    }

    res.writeHead(404).end("API Not Found");
  } catch (err) {
    console.error(err);
    sendJsonResponse(500, { success: false, message: "Internal Server Error" }, requestOrigin);
  }
};
