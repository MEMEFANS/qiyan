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
const EXPERTS_FILE = path.join(DATA_DIR, "experts.json");
const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.json");
const ASSESSORS_FILE = path.join(DATA_DIR, "assessors.json");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");

// 安全配置
let ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 加载持久化管理员配置
const loadAdminConfig = () => {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      const config = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
      if (config.username) ADMIN_USERNAME = config.username;
      if (config.password) ADMIN_PASSWORD = config.password;
    }
  } catch (e) {
    console.error("Failed to load admin config:", e);
  }
};
loadAdminConfig();

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");
if (!fs.existsSync(CASES_FILE)) fs.writeFileSync(CASES_FILE, "[]");
if (!fs.existsSync(EXPERTS_FILE)) fs.writeFileSync(EXPERTS_FILE, "[]");
if (!fs.existsSync(ASSESSMENTS_FILE)) fs.writeFileSync(ASSESSMENTS_FILE, "[]");
if (!fs.existsSync(ASSESSORS_FILE)) fs.writeFileSync(ASSESSORS_FILE, "[]");

const ASSESSOR_SESSION_MAX_AGE = 60 * 60 * 12;

const isAdminAuthenticated = (cookies = "") => cookies.includes("admin_session=authenticated");

const parseCookies = (cookies = "") => cookies
  .split(";")
  .map(part => part.trim())
  .filter(Boolean)
  .reduce((acc, part) => {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) return acc;
    acc[part.slice(0, eqIndex)] = decodeURIComponent(part.slice(eqIndex + 1));
    return acc;
  }, {});

const normalizeAssessorCode = value => String(value || "").trim().toLowerCase();

const hashAssessorCode = code => crypto
  .createHash("sha256")
  .update(normalizeAssessorCode(code))
  .digest("hex");

const readAssessors = () => {
  try {
    const data = JSON.parse(fs.readFileSync(ASSESSORS_FILE, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

const writeAssessors = assessors => {
  fs.writeFileSync(ASSESSORS_FILE, JSON.stringify(assessors, null, 2));
};

const publicAssessor = assessor => ({
  id: assessor.id,
  name: assessor.name,
  code: assessor.code,
  createdAt: assessor.createdAt,
  updatedAt: assessor.updatedAt
});

const getAssessorTokenSecret = () => process.env.ASSESSOR_TOKEN_SECRET || process.env.SESSION_SECRET || ADMIN_PASSWORD;

const signAssessorPayload = payload => crypto
  .createHmac("sha256", getAssessorTokenSecret())
  .update(payload)
  .digest("base64url");

const safeCompare = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const createAssessorToken = assessor => {
  const payload = Buffer.from(JSON.stringify({
    id: assessor.id,
    name: assessor.name,
    codeHash: hashAssessorCode(assessor.code),
    exp: Date.now() + ASSESSOR_SESSION_MAX_AGE * 1000
  })).toString("base64url");
  return `${payload}.${signAssessorPayload(payload)}`;
};

const verifyAssessorSession = cookies => {
  try {
    const token = parseCookies(cookies).assessor_session;
    if (!token) return { valid: false };
    const [payloadPart, signature] = token.split(".");
    if (!payloadPart || !signature || !safeCompare(signature, signAssessorPayload(payloadPart))) {
      return { valid: false };
    }
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf-8"));
    if (!payload.exp || payload.exp < Date.now()) return { valid: false };
    const assessor = readAssessors().find(item => item.id === payload.id);
    if (!assessor || payload.codeHash !== hashAssessorCode(assessor.code)) return { valid: false };
    return { valid: true, assessor: publicAssessor(assessor) };
  } catch (e) {
    return { valid: false };
  }
};

const hasAssessmentAccess = cookies => isAdminAuthenticated(cookies) || verifyAssessorSession(cookies).valid;

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
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, folder",
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

    // 1.1. 修改管理员密码 API
    if (urlPath === "/api/admin/config" && req.method === "POST") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const config = JSON.parse(body);
          if (!config.username || !config.password) {
            return sendJsonResponse(400, { success: false, message: "Username and password are required" }, requestOrigin);
          }
          fs.writeFileSync(ADMIN_FILE, JSON.stringify(config, null, 2));
          loadAdminConfig(); // 重新加载到内存
          sendJsonResponse(200, { success: true }, requestOrigin);
        } catch (e) {
          sendJsonResponse(400, { success: false, message: "Invalid Request" }, requestOrigin);
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
          console.log("[Auth] Unauthorized save attempt to /api/content");
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            if (!body) throw new Error("Empty body");
            // 验证是否为有效 JSON
            JSON.parse(body);
            fs.writeFileSync(DATA_FILE, body);
            console.log("[CMS] Content updated successfully");
            sendJsonResponse(200, { success: true }, requestOrigin);
          } catch (e) {
            console.error("[CMS] Save failed:", e.message);
            sendJsonResponse(500, { success: false, message: "Save failed: " + e.message }, requestOrigin);
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
      if (req.method === "DELETE") {
        const cookies = req.headers.cookie || "";
        if (!cookies.includes("admin_session=authenticated")) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const id = query.get("id");
        if (!id) return sendJsonResponse(400, { success: false, message: "ID is required" }, requestOrigin);

        try {
          let cases = JSON.parse(fs.readFileSync(CASES_FILE, "utf-8"));
          cases = cases.filter(c => c.id !== id);
          fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2));
          sendJsonResponse(200, { success: true }, requestOrigin);
        } catch (e) {
          sendJsonResponse(500, { success: false, message: "Delete failed" }, requestOrigin);
        }
        return;
      }
    }

    // 6.5. 专家团队接口
    if (urlPath === "/api/experts") {
      if (req.method === "GET") {
        try {
          const data = fs.readFileSync(EXPERTS_FILE, "utf-8");
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
            const newExpert = JSON.parse(body);
            let experts = [];
            try { experts = JSON.parse(fs.readFileSync(EXPERTS_FILE, "utf-8")); } catch(e){}
            const index = experts.findIndex(e => e.id === newExpert.id);
            if (index >= 0) experts[index] = newExpert;
            else experts.push(newExpert);
            fs.writeFileSync(EXPERTS_FILE, JSON.stringify(experts, null, 2));
            sendJsonResponse(200, { success: true }, requestOrigin);
          } catch (e) {
            sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
          }
        });
        return;
      }
      if (req.method === "DELETE") {
        const cookies = req.headers.cookie || "";
        if (!cookies.includes("admin_session=authenticated")) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const id = query.get("id");
        if (!id) return sendJsonResponse(400, { success: false, message: "ID is required" }, requestOrigin);

        try {
          let experts = JSON.parse(fs.readFileSync(EXPERTS_FILE, "utf-8"));
          experts = experts.filter(e => e.id !== id);
          fs.writeFileSync(EXPERTS_FILE, JSON.stringify(experts, null, 2));
          sendJsonResponse(200, { success: true }, requestOrigin);
        } catch (e) {
          sendJsonResponse(500, { success: false, message: "Delete failed" }, requestOrigin);
        }
        return;
      }
    }

    // 7. 评估师权限与名单接口
    if (urlPath === "/api/assessors/verify" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const { code } = JSON.parse(body || "{}");
          const normalizedCode = normalizeAssessorCode(code);
          if (!normalizedCode) {
            return sendJsonResponse(400, { success: false, message: "请输入评估师代码" }, requestOrigin);
          }
          const assessor = readAssessors().find(item => normalizeAssessorCode(item.code) === normalizedCode);
          if (!assessor) {
            return sendJsonResponse(401, { success: false, message: "评估师代码不正确" }, requestOrigin);
          }
          const token = createAssessorToken(assessor);
          const headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Credentials": "true",
            "Cache-Control": "no-store",
            "Set-Cookie": `assessor_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ASSESSOR_SESSION_MAX_AGE}`
          };
          if (requestOrigin) headers["Access-Control-Allow-Origin"] = requestOrigin;
          res.writeHead(200, headers);
          res.end(JSON.stringify({ success: true, assessor: { id: assessor.id, name: assessor.name } }));
        } catch (e) {
          sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
        }
      });
      return;
    }

    if (urlPath === "/api/assessors/session" && req.method === "GET") {
      const cookies = req.headers.cookie || "";
      const session = verifyAssessorSession(cookies);
      if (session.valid) {
        return sendJsonResponse(200, { success: true, role: "assessor", assessor: session.assessor }, requestOrigin);
      }
      if (isAdminAuthenticated(cookies)) {
        return sendJsonResponse(200, { success: true, role: "admin" }, requestOrigin);
      }
      if (!session.valid) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }
    }

    if (urlPath === "/api/assessors") {
      const cookies = req.headers.cookie || "";
      if (!isAdminAuthenticated(cookies)) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }

      if (req.method === "GET") {
        return sendJsonResponse(200, readAssessors().map(publicAssessor), requestOrigin);
      }

      if (req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            const name = String(payload.name || "").trim();
            const code = String(payload.code || "").trim();
            if (!name || !code) {
              return sendJsonResponse(400, { success: false, message: "姓名和代码不能为空" }, requestOrigin);
            }
            const assessors = readAssessors();
            const id = payload.id || `assessor-${Date.now()}`;
            const duplicate = assessors.find(item => item.id !== id && normalizeAssessorCode(item.code) === normalizeAssessorCode(code));
            if (duplicate) {
              return sendJsonResponse(409, { success: false, message: "评估师代码已存在" }, requestOrigin);
            }
            const now = new Date().toISOString();
            const index = assessors.findIndex(item => item.id === id);
            const assessor = {
              id,
              name,
              code,
              createdAt: index >= 0 ? assessors[index].createdAt : now,
              updatedAt: now
            };
            if (index >= 0) assessors[index] = assessor;
            else assessors.push(assessor);
            writeAssessors(assessors);
            sendJsonResponse(200, { success: true, assessor: publicAssessor(assessor) }, requestOrigin);
          } catch (e) {
            sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
          }
        });
        return;
      }

      if (req.method === "DELETE") {
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const id = query.get("id");
        if (!id) return sendJsonResponse(400, { success: false, message: "ID is required" }, requestOrigin);
        const assessors = readAssessors().filter(item => item.id !== id);
        writeAssessors(assessors);
        return sendJsonResponse(200, { success: true }, requestOrigin);
      }
    }

    // 8. 专业评估记录接口
    if (urlPath === "/api/assessments") {
      const cookies = req.headers.cookie || "";

      if (req.method === "GET") {
        if (!isAdminAuthenticated(cookies)) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        try {
          const data = fs.readFileSync(ASSESSMENTS_FILE, "utf-8");
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": requestOrigin || "*",
            "Access-Control-Allow-Credentials": "true",
            "Cache-Control": "no-store"
          });
          res.end(data);
        } catch (e) {
          sendJsonResponse(200, [], requestOrigin);
        }
        return;
      }

      if (req.method === "POST") {
        if (!hasAssessmentAccess(cookies)) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const assessment = JSON.parse(body);
            assessment.id = assessment.id || `assessment-${Date.now()}`;
            assessment.updatedAt = new Date().toISOString();
            let assessments = [];
            try { assessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, "utf-8")); } catch(e){}
            const index = assessments.findIndex(item => item.id === assessment.id);
            if (index >= 0) {
              assessment.createdAt = assessments[index].createdAt || assessment.createdAt || assessment.updatedAt;
              assessments[index] = assessment;
            } else {
              assessment.createdAt = assessment.createdAt || assessment.updatedAt;
              assessments.push(assessment);
            }
            fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
            sendJsonResponse(200, { success: true, id: assessment.id }, requestOrigin);
          } catch (e) {
            sendJsonResponse(400, { success: false, message: "Bad Request" }, requestOrigin);
          }
        });
        return;
      }

      if (req.method === "DELETE") {
        if (!isAdminAuthenticated(cookies)) {
          return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
        }
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const id = query.get("id");
        if (!id) return sendJsonResponse(400, { success: false, message: "ID is required" }, requestOrigin);

        try {
          let assessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, "utf-8"));
          assessments = assessments.filter(item => item.id !== id);
          fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
          sendJsonResponse(200, { success: true }, requestOrigin);
        } catch (e) {
          sendJsonResponse(500, { success: false, message: "Delete failed" }, requestOrigin);
        }
        return;
      }
    }

    // 8. 图片上传接口 (自有服务器直接存 assets)
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

    // 9. 获取/删除文件接口
    if (urlPath === "/api/files") {
      const cookies = req.headers.cookie || "";
      if (!cookies.includes("admin_session=authenticated")) {
        return sendJsonResponse(401, { success: false, message: "Unauthorized" }, requestOrigin);
      }

      if (req.method === "GET") {
        const folder = req.headers.folder || "uploads";
        const dirPath = path.join(root, "assets", folder);
        try {
          if (!fs.existsSync(dirPath)) {
            return sendJsonResponse(200, [], requestOrigin);
          }
          const files = fs.readdirSync(dirPath)
            .filter(file => !file.startsWith("."))
            .map(file => ({
              name: file,
              path: `/assets/${folder}/${file}`
            }));
          sendJsonResponse(200, files, requestOrigin);
        } catch (e) {
          sendJsonResponse(500, { success: false, message: "Read folder failed" }, requestOrigin);
        }
        return;
      }

      if (req.method === "DELETE") {
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const filePathParam = query.get("path");
        if (!filePathParam) {
          return sendJsonResponse(400, { success: false, message: "Path is required" }, requestOrigin);
        }

        // 安全校验：只允许删除 assets 目录下的文件
        if (!filePathParam.startsWith("/assets/")) {
          return sendJsonResponse(403, { success: false, message: "Forbidden" }, requestOrigin);
        }

        const fullPath = path.join(root, filePathParam);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            sendJsonResponse(200, { success: true }, requestOrigin);
          } else {
            sendJsonResponse(404, { success: false, message: "File not found" }, requestOrigin);
          }
        } catch (e) {
          console.error("[Storage] Delete failed:", e);
          sendJsonResponse(500, { success: false, message: "Delete failed" }, requestOrigin);
        }
        return;
      }
    }

    // --- 静态文件处理 ---
    const rel = urlPath === "/" ? "/index.html" : urlPath;
    if ((rel === "/assessment.html" || rel === "/assessment") && !hasAssessmentAccess(req.headers.cookie || "")) {
      res.writeHead(302, { "Location": "/?assessmentAccess=required" });
      res.end();
      return;
    }

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
