/**
 * 展厅管理器
 * Gallery Manager
 * 负责管理展品列表、切换和状态
 */

class GalleryManager {
    constructor(exhibits) {
        this.exhibits = exhibits;
        this.currentIndex = 0;
        this.currentExhibit = null;
        this.listeners = [];
    }

    /**
     * 初始化展厅
     */
    init() {
        this.currentExhibit = this.exhibits[0];
        this.updateUI();
        this.notifyListeners('init', this.currentExhibit);
    }

    /**
     * 获取当前展品
     */
    getCurrentExhibit() {
        return this.currentExhibit;
    }

    /**
     * 获取展品总数
     */
    getTotalCount() {
        return this.exhibits.length;
    }

    /**
     * 获取当前索引
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * 切换到下一个展品
     */
    next() {
        if (this.currentIndex < this.exhibits.length - 1) {
            this.currentIndex++;
            this._updateCurrentExhibit();
            return true;
        }
        return false;
    }

    /**
     * 切换到上一个展品
     */
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this._updateCurrentExhibit();
            return true;
        }
        return false;
    }

    /**
     * 跳转到指定展品
     */
    goTo(index) {
        if (index >= 0 && index < this.exhibits.length) {
            this.currentIndex = index;
            this._updateCurrentExhibit();
            return true;
        }
        return false;
    }

    /**
     * 通过ID查找展品
     */
    findExhibitById(id) {
        return this.exhibits.find(exhibit => exhibit.id === id);
    }

    /**
     * 内部方法：更新当前展品
     */
    _updateCurrentExhibit() {
        const previousExhibit = this.currentExhibit;
        this.currentExhibit = this.exhibits[this.currentIndex];
        this.updateUI();
        this.notifyListeners('change', {
            previous: previousExhibit,
            current: this.currentExhibit
        });
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        // 更新计数器
        const currentIndexEl = document.getElementById('current-index');
        const totalCountEl = document.getElementById('total-count');

        if (currentIndexEl) currentIndexEl.textContent = this.currentIndex + 1;
        if (totalCountEl) totalCountEl.textContent = this.exhibits.length;

        // 更新按钮状态
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === this.exhibits.length - 1;

        // 更新展品信息
        const infoPanel = document.getElementById('exhibit-info');
        const nameEl = document.getElementById('exhibit-name');
        const descEl = document.getElementById('exhibit-description');

        if (nameEl) nameEl.textContent = this.currentExhibit.name;
        if (descEl) descEl.textContent = this.currentExhibit.description;
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        this.listeners = this.listeners.filter(
            listener => listener.event !== event || listener.callback !== callback
        );
    }

    /**
     * 通知所有监听器
     */
    notifyListeners(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }

    /**
     * 获取所有展品
     */
    getAllExhibits() {
        return [...this.exhibits];
    }

    /**
     * 添加新展品
     */
    addExhibit(exhibit) {
        this.exhibits.push(exhibit);
        this.updateUI();
        this.notifyListeners('add', exhibit);
    }

    /**
     * 移除展品
     */
    removeExhibit(id) {
        const index = this.exhibits.findIndex(e => e.id === id);
        if (index !== -1) {
            const removed = this.exhibits.splice(index, 1)[0];

            // 如果删除的是当前展品，切换到第一个展品
            if (this.currentExhibit.id === id) {
                this.currentIndex = 0;
                this._updateCurrentExhibit();
            } else if (this.currentIndex > index) {
                this.currentIndex--;
            }

            this.updateUI();
            this.notifyListeners('remove', removed);
            return true;
        }
        return false;
    }
}

// 创建全局展厅管理器实例
const gallery = new GalleryManager(exhibits);
