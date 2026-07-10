const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
// 在 Vercel 环境下，我们使用 /tmp，但在本地环境下我们优先使用根目录
const isVercel = process.env.VERCEL || process.env.NOW_REGION;
const DATA_FILE = isVercel ? "/tmp/data.json" : path.join(root, "data.json");
const BOOKINGS_FILE = isVercel ? "/tmp/bookings.json" : path.join(root, "bookings.json");
const CASES_FILE = isVercel ? "/tmp/cases.json" : path.join(root, "cases.json");
const ASSESSMENTS_FILE = isVercel ? "/tmp/assessments.json" : path.join(root, "assessments.json");
const ASSESSORS_FILE = isVercel ? "/tmp/assessors.json" : path.join(root, "assessors.json");

// 安全配置
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");
if (!fs.existsSync(CASES_FILE)) fs.writeFileSync(CASES_FILE, "[]");
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
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
            console.error("Save content error:", e);
            sendJsonResponse(500, { success: false, message: "Save failed: " + e.message }, requestOrigin);
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
          let bookings = [];
          try {
            bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
          } catch (e) {}
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

    // 7b. 康复案例接口 (公开获取)
    if (urlPath.endsWith("/cases") && req.method === "GET") {
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
          let cases = [];
          try {
            cases = JSON.parse(fs.readFileSync(CASES_FILE, "utf-8"));
          } catch (e) {}
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

    // 8. 评估师权限与名单接口
    if (urlPath.endsWith("/assessors/verify") && req.method === "POST") {
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

    if (urlPath.endsWith("/assessors/session") && req.method === "GET") {
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

    if (urlPath.endsWith("/assessors")) {
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
        const url = new URL(req.url, `http://${req.headers.host}`);
        const id = url.searchParams.get("id");
        if (!id) return sendJsonResponse(400, { success: false, message: "ID is required" }, requestOrigin);
        const assessors = readAssessors().filter(item => item.id !== id);
        writeAssessors(assessors);
        return sendJsonResponse(200, { success: true }, requestOrigin);
      }
    }

    // 9. 专业评估记录接口
    if (urlPath.endsWith("/assessments")) {
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
            try {
              assessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, "utf-8"));
            } catch (e) {}
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
        const url = new URL(req.url, `http://${req.headers.host}`);
        const id = url.searchParams.get("id");
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

    // 9. 图片上传接口 (Vercel 环境特殊处理)
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
          
          // 在 Vercel 生产环境下，由于文件系统是只读的，
          // 我们只能尝试保存到 /tmp，但这样图片在重启后会丢失。
          // 更好的方案是使用云存储（如 Vercel Blob, OSS 等）。
          // 这里先尝试写入 /tmp 并在响应中说明。
          const uploadDir = path.join("/tmp", "assets", folder || "uploads");
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          const finalPath = path.join(uploadDir, fileName);
          
          fs.writeFileSync(finalPath, buffer);
          
          // 注意：前端可能无法直接访问 /tmp 下的图片
          sendJsonResponse(200, { 
            success: true, 
            message: "Uploaded to temporary storage (will be lost on restart)",
            path: "/api/images?path=" + encodeURIComponent(path.join(folder || "uploads", fileName))
          }, requestOrigin);
        } catch (e) {
          console.error("Upload error:", e);
          sendJsonResponse(500, { success: false, message: "Upload failed: " + e.message }, requestOrigin);
        }
      });
      return;
    }

    // 10. 获取上传的图片 (代理访问 /tmp 目录)
    if (urlPath.endsWith("/images") && req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const imagePath = url.searchParams.get("path");
      if (!imagePath) return sendJsonResponse(400, { message: "Missing path" }, requestOrigin);
      
      const fullPath = path.join("/tmp", "assets", imagePath);
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        res.writeHead(200, { "Content-Type": mime[ext] || "image/png" });
        res.end(fs.readFileSync(fullPath));
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
      return;
    }
    // 11. 获取文件列表接口
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
