// 心动表白墙功能
class LoveWall {
    constructor() {
        this.loveList = JSON.parse(localStorage.getItem('loveList')) || [];
        this.albumList = JSON.parse(localStorage.getItem('albumList')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderLoveList();
        this.renderAlbumList();
        this.updateCounts();
    }

    bindEvents() {
        // 表白提交事件
        document.getElementById('love-submit').addEventListener('click', () => {
            this.submitLove();
        });

        // 表白内容回车提交
        document.getElementById('love-content').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitLove();
            }
        });

        // 图片上传事件
        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
    }

    submitLove() {
        const nameInput = document.getElementById('love-name');
        const contentInput = document.getElementById('love-content');
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        if (!content) {
            alert('请输入表白内容');
            return;
        }

        const loveItem = {
            id: Date.now(),
            name: name || '匿名',
            content: content,
            time: new Date().toLocaleString('zh-CN'),
            likes: 0
        };

        this.loveList.unshift(loveItem);
        this.saveLoveList();
        this.renderLoveList();
        this.updateCounts();

        // 清空输入框
        contentInput.value = '';
        nameInput.value = '';

        // 显示成功提示
        this.showMessage('💕 表白发布成功！', 'success');
    }

    renderLoveList() {
        const loveListEl = document.getElementById('love-list');
        const emptyEl = document.getElementById('love-empty');

        if (this.loveList.length === 0) {
            loveListEl.style.display = 'none';
            emptyEl.style.display = 'flex';
            return;
        }

        loveListEl.style.display = 'block';
        emptyEl.style.display = 'none';

        loveListEl.innerHTML = this.loveList.map(love => `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-love rounded-full flex items-center justify-center text-white font-bold mr-3">
                            ${love.name.charAt(0)}
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">${love.name}</div>
                            <div class="text-xs text-gray-500">${love.time}</div>
                        </div>
                    </div>
                    <button class="text-gray-400 hover:text-red-500 delete-love" data-id="${love.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="text-gray-700 leading-relaxed">${this.escapeHtml(love.content)}</div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <button class="text-gray-400 hover:text-love-dark like-btn" data-id="${love.id}">
                        <i class="fas fa-heart mr-1"></i>
                        <span class="like-count">${love.likes}</span>
                    </button>
                    <div class="text-xs text-gray-400">
                        <i class="fas fa-comment mr-1"></i>回复
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定删除事件
        loveListEl.querySelectorAll('.delete-love').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.delete-love').dataset.id);
                this.deleteLove(id);
            });
        });

        // 绑定点赞事件
        loveListEl.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.like-btn').dataset.id);
                this.likeLove(id);
            });
        });
    }

    deleteLove(id) {
        if (confirm('确定要删除这条表白吗？')) {
            this.loveList = this.loveList.filter(love => love.id !== id);
            this.saveLoveList();
            this.renderLoveList();
            this.updateCounts();
            this.showMessage('🗑️ 表白已删除', 'info');
        }
    }

    likeLove(id) {
        const love = this.loveList.find(l => l.id === id);
        if (love) {
            love.likes++;
            this.saveLoveList();
            this.renderLoveList();
        }
    }

    // 相册功能
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const albumItem = {
                id: Date.now(),
                url: event.target.result,
                name: file.name,
                time: new Date().toLocaleString('zh-CN'),
                size: this.formatFileSize(file.size)
            };

            this.albumList.unshift(albumItem);
            this.saveAlbumList();
            this.renderAlbumList();
            this.updateCounts();
            this.showMessage('📸 照片上传成功！', 'success');
        };
        reader.readAsDataURL(file);

        // 清空文件输入
        e.target.value = '';
    }

    renderAlbumList() {
        const albumListEl = document.getEleme
        const emptyEl = document.getElementById('album-empty');

        if (this.albumList.length === 0) {
            albumListEl.style.display = 'none';
            emptyEl.style.display = 'flex';
            return;
        }

        albumListEl.style.display = 'grid';
        emptyEl.style.display = 'none';

        albumListEl.innerHTML = this.albumList.map(album => `
            <div class="relative group">
                <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden card-hover">
                    <img src="${album.url}" alt="${album.name}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <button class="text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delete-album" data-id="${album.id}">
                            <i class="fas fa-trash text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2 text-xs text-gray-500 truncate">${album.name}</div>
                <div class="text-xs text-gray-400">${album.time}</div>
            </div>
        `).join('');

        // 绑定删除事件
        albumListEl.querySelectorAll('.delete-album').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.delete-album').dataset.id);
                this.deleteAlbum(id);
            });
        });

        // 绑定图片点击预览
        albumListEl.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', (e) => {
                this.previewImage(e.target.src);
            });
        });
    }

    deleteAlbum(id) {
        if (confirm('确定要删除这张照片吗？')) {
            this.albumList = this.albumList.filter(album => album.id !== id);
            this.saveAlbumList();
            this.renderAlbumList();
            this.updateCounts();
            this.showMessage('🗑️ 照片已删除', 'info');
        }
    }

    previewImage(url) {
        // 创建图片预览模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-full">
                <img src="${url}" class="max-w-full max-h-full" alt="预览">
                <button class="absolute top-4 right-4 text-white text-2xl" onclick="this.closest('.fixed').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    updateCounts() {
        document.getElementById('love-count').textContent = this.loveList.length;
        document.getElementById('album-count').textContent = this.albumList.length;
    }

    saveLoveList() {
        localStorage.setItem('loveList', JSON.stringify(this.loveList));
    }

    saveAlbumList() {
        localStorage.setItem('albumList', JSON.stringify(this.albumList));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMessage(text, type = 'info') {
        // 创建消息提示
        const message = document.createElement('div');
        message.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        message.textContent = text;
        document.body.appendChild(message);

        // 显示动画
        setTimeout(() => {
            message.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            message.style.transform = 'translateX(full)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LoveWall();
});
