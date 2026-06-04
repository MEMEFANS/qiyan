# 启言社交训练中心 - 后台管理系统

## 功能说明

这是一个简单的后台管理系统，用于修改网站内容。系统使用 localStorage 存储数据，无需数据库。

## 使用方法

### 1. 登录后台

访问 `admin/login.html` 页面

**默认账号（建议通过环境变量修改）：**
- 用户名：`admin` (可通过环境变量 `ADMIN_USERNAME` 设置)
- 密码：`admin123` (可通过环境变量 `ADMIN_PASSWORD` 设置)

*注意：为了安全，生产环境必须设置环境变量。如果连续 5 次登录失败，IP 将被锁定 15 分钟。*

### 2. 修改内容

登录后会跳转到 `admin/dashboard.html`，可以修改以下内容：

#### 首页内容
- Hero 区域主标题
- Hero 区域副标题
- 数据统计（服务家庭数、专业专家数、训练时长、满意度）
- 联系信息（电话、微信、地址、营业时间）

### 3. 保存更改

点击右上角的"保存更改"按钮，内容会保存到浏览器的 localStorage 中。

### 4. 查看效果

刷新网站首页，修改的内容会自动显示。

## 技术说明

### 数据存储
- 使用浏览器 localStorage 存储数据
- 数据以 JSON 格式存储在 `siteContent` 键下

### 内容加载
- 网站页面引入 `admin/content-loader.js` 脚本
- 脚本会自动从 localStorage 读取数据并更新页面内容
- 页面元素需要添加 `data-content` 属性才能被动态更新

### 添加新的可编辑内容

1. 在页面 HTML 中给元素添加 `data-content` 属性
2. 在 `admin/dashboard.html` 中添加对应的输入框
3. 在 `admin/content-loader.js` 中添加加载逻辑
4. 在保存逻辑中添加保存该字段的代码

### 示例

在 HTML 中：
```html
<h1 data-content="pageTitle">默认标题</h1>
```

在 content-loader.js 中：
```javascript
if (data.pageTitle) {
  const pageTitleEl = document.querySelector('[data-content="pageTitle"]');
  if (pageTitleEl) pageTitleEl.textContent = data.pageTitle;
}
```

## 安全提示

- 当前系统仅用于演示和测试
- 默认密码在生产环境中需要修改
- 数据存储在浏览器本地，清除浏览器数据会丢失修改
- 生产环境建议使用真实的后端数据库

## 文件结构

```
admin/
├── login.html          # 登录页面
├── dashboard.html      # 后台仪表板
├── content-loader.js   # 内容加载脚本
└── README.md          # 说明文档
```

## 浏览器兼容性

- 支持所有现代浏览器（Chrome、Firefox、Safari、Edge）
- 需要启用 JavaScript
- 需要 localStorage 支持
