// 后端接口基础地址（若部署到远程服务器，替换为服务器的IP/域名+端口）
const API_BASE_URL = ''; // 本地运行时，前端和后端同端口，可留空；远程部署时改为http://你的服务器IP:3000

// ====================== 工具函数：显示提示框（Toast） ======================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-love' : 'bg-red-500';
    const icon = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation';
    toast.className = `fixed top-20 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-500 transform translate-y-0 opacity-100`;
    toast.innerHTML = `<i class="${icon} mr-2"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

// ====================== 表白墙功能（调用后端API） ======================
const loveNameInput = document.getElementById('love-name');
const loveContentInput = document.getElementById('love-content');
const loveSubmitBtn = document.getElementById('love-submit');
const loveList = document.getElementById('love-list');
const loveEmpty = document.getElementById('love-empty');
const loveCount = document.getElementById('love-count');

let loveData = [];

// 1. 从后端获取表白数据
async function fetchLoveData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/love`);
        if (!response.ok) {
            throw new Error('获取表白数据失败');
        }
        loveData = await response.json();
        renderLoveList();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 2. 发布表白到后端
async function submitLoveData() {
    const name = loveNameInput.value.trim();
    const content = loveContentInput.value.trim();

    if (!content) {
        showToast('表白内容不能为空哦～', 'error');
        return;
    }

    const newLove = {
        name: name,
        content: content,
        time: new Date().toLocaleString()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/love`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newLove)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '发布表白失败');
        }

        // 清空输入框并重新获取数据
        loveNameInput.value = '';
        loveContentInput.value = '';
        loveContentInput.focus();
        fetchLoveData(); // 重新拉取数据
        showToast('表白发布成功！');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 3. 渲染表白墙
function renderLoveList() {
    loveList.innerHTML = '';
    loveCount.textContent = loveData.length;

    // 处理空状态
    if (loveData.length === 0) {
        loveEmpty.classList.remove('hidden');
        loveList.classList.add('hidden');
        return;
    } else {
        loveEmpty.classList.add('hidden');
        loveList.classList.remove('hidden');
    }

    // 倒序渲染（最新的在最上面）
    [...loveData].reverse().forEach((item) => {
        const loveItem = document.createElement('div');
        loveItem.className = 'p-5 border border-neutral-200 rounded-xl bg-neutral-50 card-hover';
        loveItem.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-love-dark text-lg">${item.name || '匿名心动者'}</h3>
                <span class="text-xs text-gray-500 bg-neutral-200 px-2 py-0.5 rounded-full">
                    ${item.time}
                </span>
            </div>
            <p class="text-gray-700 leading-relaxed">${item.content}</p>
            <div class="mt-3 flex justify-end">
                <span class="text-xs text-love/60 flex items-center">
                    <i class="fas fa-heart mr-1"></i> 心动值 +${Math.floor(Math.random() * 50) + 10}
                </span>
            </div>
        `;
        loveList.appendChild(loveItem);
    });
}

// 绑定发布表白按钮事件
loveSubmitBtn.addEventListener('click', submitLoveData);

// ====================== 相册功能（调用后端API） ======================
const imageUpload = document.getElementById('image-upload');
const albumList = document.getElementById('album-list');
const albumEmpty = document.getElementById('album-empty');
const albumCount = document.getElementById('album-count');

let albumData = [];

// 1. 从后端获取相册数据
async function fetchAlbumData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/album`);
        if (!response.ok) {
            throw new Error('获取相册数据失败');
        }
        albumData = await response.json();
        renderAlbumList();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 2. 上传图片到后端
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file); // 注意：键名要和后端的upload.single('image')一致

    try {
        const response = await fetch(`${API_BASE_URL}/api/album/upload`, {
            method: 'POST',
            body: formData // FormData无需设置Content-Type，浏览器会自动处理
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '图片上传失败');
        }

        fetchAlbumData(); // 重新拉取数据
        showToast('图片上传成功！');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 3. 删除图片（调用后端接口）
async function deleteImage(index) {
    if (!confirm('确定要删除这张照片吗？删除后无法恢复哦～')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/album/${index}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '图片删除失败');
        }

        fetchAlbumData(); // 重新拉取数据
        showToast('图片删除成功！');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 4. 渲染相册
function renderAlbumList() {
    albumList.innerHTML = '';
    albumCount.textContent = albumData.length;

    // 处理空状态
    if (albumData.length === 0) {
        albumEmpty.classList.remove('hidden');
        albumList.classList.add('hidden');
        return;
    } else {
        albumEmpty.classList.add('hidden');
        albumList.classList.remove('hidden');
    }

    // 渲染相册图片
    albumData.forEach((item, index) => {
        const albumItem = document.createElement('div');
        albumItem.className = 'album-item relative overflow-hidden rounded-xl border border-neutral-200 shadow-sm';
        albumItem.innerHTML = `
            <img src="${API_BASE_URL}${item.path}" alt="时光照片${index+1}" class="w-full h-48 object-cover">
            <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent text-white p-2 text-xs">
                ${item.time}
            </div>
            <button class="delete-btn absolute top-2 right-2 bg-red-500/90 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        albumList.appendChild(albumItem);

        // 绑定删除按钮事件
        albumItem.querySelector('.delete-btn').addEventListener('click', () => {
            deleteImage(index);
        });
    });
}

// 绑定图片上传事件（单文件上传，若需多文件可循环处理）
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadImage(file);
        imageUpload.value = ''; // 清空文件选择框
    }
});

// ====================== 页面加载时初始化 ======================
window.addEventListener('load', () => {
    fetchLoveData(); // 加载表白数据
    fetchAlbumData(); // 加载相册数据
});