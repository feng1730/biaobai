// 引入所需依赖
const express = require('express');
const multer = require('multer'); // 处理文件上传的核心库
const cors = require('cors'); // 解决跨域问题
const fs = require('fs'); // 操作文件系统（读写JSON、删除图片）
const path = require('path'); // 处理文件路径

// 初始化Express应用
const app = express();
const port = 3000; // 后端服务端口（可自行修改，如8080）

// 配置中间件
app.use(cors()); // 允许所有跨域请求（生产环境可限制域名）
app.use(express.json()); // 解析JSON格式的请求体
app.use(express.static('public')); // 托管public文件夹（前端静态文件）
app.use('/uploads', express.static('uploads')); // 托管uploads文件夹（让前端能访问上传的图片）

// ====================== 初始化数据文件（若不存在则创建） ======================
const dataDir = path.join(__dirname, 'data');
const loveDataPath = path.join(dataDir, 'loveData.json');
const albumDataPath = path.join(dataDir, 'albumData.json');

// 创建data文件夹（若不存在）
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化表白数据文件
if (!fs.existsSync(loveDataPath)) {
  fs.writeFileSync(loveDataPath, JSON.stringify([], null, 2), 'utf8');
}

// 初始化相册数据文件
if (!fs.existsSync(albumDataPath)) {
  fs.writeFileSync(albumDataPath, JSON.stringify([], null, 2), 'utf8');
}

// ====================== 配置multer实现图片上传 ======================
// 配置图片存储路径和文件名（避免重名）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 上传的图片保存到uploads文件夹（若不存在则创建）
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 原文件名（避免重名）
    const uniqueFileName = `${Date.now()}-${path.basename(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// 过滤文件类型（只允许图片）
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // 允许上传
  } else {
    cb(new Error('只能上传图片文件！'), false); // 拒绝上传
  }
};

// 初始化multer上传对象（限制单张图片10MB）
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// ====================== 表白数据接口 ======================
// 1. 获取所有表白数据（GET请求）
app.get('/api/love', (req, res) => {
  try {
    const loveData = JSON.parse(fs.readFileSync(loveDataPath, 'utf8'));
    res.status(200).json(loveData);
  } catch (error) {
    res.status(500).json({ message: '获取表白数据失败', error: error.message });
  }
});

// 2. 添加新的表白数据（POST请求）
app.post('/api/love', (req, res) => {
  try {
    const newLove = req.body;
    if (!newLove.content) {
      return res.status(400).json({ message: '表白内容不能为空！' });
    }
    // 读取原有数据
    const loveData = JSON.parse(fs.readFileSync(loveDataPath, 'utf8'));
    // 添加新数据（补充时间戳，前端也可传，后端兜底）
    newLove.time = newLove.time || new Date().toLocaleString();
    loveData.push(newLove);
    // 写入文件
    fs.writeFileSync(loveDataPath, JSON.stringify(loveData, null, 2), 'utf8');
    res.status(200).json({ message: '表白发布成功', data: newLove });
  } catch (error) {
    res.status(500).json({ message: '发布表白失败', error: error.message });
  }
});

// ====================== 相册图片接口 ======================
// 1. 获取所有相册数据（GET请求）
app.get('/api/album', (req, res) => {
  try {
    const albumData = JSON.parse(fs.readFileSync(albumDataPath, 'utf8'));
    res.status(200).json(albumData);
  } catch (error) {
    res.status(500).json({ message: '获取相册数据失败', error: error.message });
  }
});

// 2. 上传图片（POST请求，结合multer）
app.post('/api/album/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片！' });
    }
    // 构建图片信息（前端需要的路径和信息）
    const imageInfo = {
      filename: req.file.filename, // 服务器上的文件名
      path: `/uploads/${req.file.filename}`, // 前端访问的路径
      time: new Date().toLocaleString() // 上传时间
    };
    // 读取原有相册数据
    const albumData = JSON.parse(fs.readFileSync(albumDataPath, 'utf8'));
    albumData.push(imageInfo);
    // 写入文件
    fs.writeFileSync(albumDataPath, JSON.stringify(albumData, null, 2), 'utf8');
    res.status(200).json({ message: '图片上传成功', data: imageInfo });
  } catch (error) {
    res.status(500).json({ message: '图片上传失败', error: error.message });
  }
});

// 3. 删除图片（DELETE请求）
app.delete('/api/album/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    // 读取原有相册数据
    const albumData = JSON.parse(fs.readFileSync(albumDataPath, 'utf8'));
    if (index < 0 || index >= albumData.length) {
      return res.status(400).json({ message: '图片不存在！' });
    }
    // 删除服务器上的图片文件
    const image = albumData[index];
    const imagePath = path.join(__dirname, image.path.slice(1)); // 去掉路径开头的/
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // 删除文件
    }
    // 删除数据中的记录
    albumData.splice(index, 1);
    // 写入文件
    fs.writeFileSync(albumDataPath, JSON.stringify(albumData, null, 2), 'utf8');
    res.status(200).json({ message: '图片删除成功' });
  } catch (error) {
    res.status(500).json({ message: '图片删除失败', error: error.message });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`后端服务已启动，访问地址：http://localhost:${port}`);
  console.log(`前端页面地址：http://localhost:${port}`);
  console.log(`图片访问前缀：http://localhost:${port}/uploads/`);
});