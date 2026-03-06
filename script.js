// 文案生成器主逻辑
class CopywriterGenerator {
    constructor() {
        this.history = this.loadHistory();
        this.initElements();
        this.bindEvents();
        this.renderHistory();
    }

    // 初始化DOM元素
    initElements() {
        this.topicInput = document.getElementById('topic');
        this.typeSelect = document.getElementById('type');
        this.styleSelect = document.getElementById('style');
        this.lengthSelect = document.getElementById('length');
        this.generateBtn = document.getElementById('generateBtn');
        this.resultSection = document.getElementById('resultSection');
        this.resultText = document.getElementById('resultText');
        this.resultCard = document.getElementById('resultCard');
        this.copyBtn = document.getElementById('copyBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.wordCount = document.getElementById('wordCount');
        this.historySection = document.getElementById('historySection');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.toast = document.getElementById('toast');
    }

    // 绑定事件
    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generate());
        this.copyBtn.addEventListener('click', () => this.copyResult());
        this.regenerateBtn.addEventListener('click', () => this.generate());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // 生成文案
    async generate() {
        const topic = this.topicInput.value.trim();
        if (!topic) {
            this.showToast('请输入主题');
            this.topicInput.focus();
            return;
        }

        // 显示加载状态
        this.setLoading(true);

        // 模拟AI生成（实际项目中应调用后端API）
        const type = this.typeSelect.value;
        const style = this.styleSelect.value;
        const length = this.lengthSelect.value;

        // 模拟网络延迟
        await this.delay(1000);

        const result = this.generateCopy(topic, type, style, length);

        // 显示结果
        this.displayResult(result);

        // 添加到历史记录
        this.addToHistory(topic, type, style, result);

        // 恢复按钮状态
        this.setLoading(false);
    }

    // 生成文案逻辑（模拟AI）
    generateCopy(topic, type, style, length) {
        const typeNames = {
            moments: '朋友圈文案',
            ad: '广告语',
            article: '短文'
        };

        const styleMap = {
            casual: '轻松活泼',
            professional: '专业正式',
            emotional: '情感共鸣',
            humorous: '幽默风趣',
            literary: '文艺清新'
        };

        // 根据不同类型和风格生成文案
        let templates = this.getTemplates(type, style);
        const template = templates[Math.floor(Math.random() * templates.length)];

        let result = template.replace(/{topic}/g, topic);
        result = this.adjustLength(result, length);

        return result;
    }

    // 获取文案模板
    getTemplates(type, style) {
        const templates = {
            moments: {
                casual: [
                    "今天发现{topic}真的太赞了！强烈推荐给大家～✨",
                    "分享一个我的新发现：{topic}，用过都说好！",
                    "生活需要小确幸，{topic}刚好就是我的那个小确幸～"
                ],
                professional: [
                    "【行业洞察】{topic}，值得关注的趋势分析。",
                    "专业推荐：{topic}，品质之选。",
                    "深度解析：{topic}的核心优势。"
                ],
                emotional: [
                    "遇见{topic}的那一刻，内心被深深触动了...",
                    "有些相遇是命中注定，就像我和{topic}。",
                    "{topic}，让生活多了一份温暖。"
                ],
                humorous: [
                    "本来想低调的，但{topic}真的不允许我低调啊！😂",
                    "关于{topic}，我有话要说...（省略一万字）",
                    "别人：... 我：{topic}真香！"
                ],
                literary: [
                    "于千万人之中，遇见{topic}，便是最好的安排。",
                    "{topic}，如春风拂面般温柔了岁月。",
                    "在时光的缝隙里，{topic}闪闪发光。"
                ]
            },
            ad: {
                casual: [
                    "{topic}，年轻人的首选！");
                    "不吹不黑，{topic}真的很给力！",
                    "选{topic}，没错的！"
                ],
                professional: [
                    "{topic}——专业值得信赖。",
                    "品质之选，{topic}。",
                    "值得托付，{topic}。"
                ],
                emotional: [
                    "{topic}，懂你所需。",
                    "用心之作，{topic}守护你。",
                    "{topic}，温暖每一个瞬间。"
                ],
                humorous: [
                    "{topic}，用了都说好！（亲测有效）",
                    "别再犹豫了，{topic}就是你的不二之选！",
                    "{topic}，真香警告！"
                ],
                literary: [
                    "{topic}，品质生活的诗意表达。",
                    "遇见{topic}，遇见更美好的自己。",
                    "{topic}，写给生活的情书。"
                ]
            },
            article: {
                casual: [
                    "说到{topic}，我有太多想分享的了。第一次接触的时候，就被深深吸引了。经过一段时间的使用，我发现它真的改变了我的生活节奏。如果你也在寻找，不妨试试看，相信你会有新的发现。",
                    "{topic}绝对是近期发现的宝藏。简单来说，它让生活变得更加便捷和美好。强烈推荐给有兴趣的朋友，希望你们也能从中找到属于自己的小确幸。",
                    "最近在研究{topic}，越深入了解越觉得有意思。它不仅仅是表面上看起来那么简单，背后还有很多值得探索的地方。在这里分享我的心得，希望能给大家一些参考。"
                ],
                professional: [
                    "{topic}在当前市场中展现出强大的竞争力。从专业角度来看，其核心优势在于品质的可靠性和服务的专业度。对于追求高标准的用户而言，这是一个值得信赖的选择。",
                    "深入分析{topic}，我们可以看到其在专业领域的独特价值。经过多方对比和研究，它在同类别产品中表现突出，能够满足专业用户的高标准要求。",
                    "{topic}代表了一种专业标准。通过对其特性的分析，我们可以理解为什么它能够获得行业的广泛认可。这是一个成熟而可靠的选择。"
                ],
                emotional: [
                    "与{topic}的相遇，像是命中注定。在人生的某个路口，它就这样悄然出现，带给了我意想不到的温暖和力量。有时候想，美好的事物总会以最恰当的方式来到我们身边。",
                    "每当想起{topic}，内心总会涌起一股暖流。它不仅仅是一个选择，更是一种陪伴。在这个快节奏的世界里，能够找到这样的存在，本身就是一种幸运。",
                    "{topic}让我明白，生活中真正重要的东西往往是那些能够触动人心的细节。它带给我的不仅是实用性，更是一种情感的寄托和心灵的慰藉。"
                ],
                humorous: [
                    "关于{topic}，我本来是不抱什么期望的（别问为什么，问就是命）。结果呢？真香定律再次应验！现在每天不用都不舒服，这算不算是另一种形式的打脸？",
                    "朋友们都在讨论{topic}，我一开始还觉得是营销噱头。直到亲自试了试...好吧，我撤回之前的质疑。这波是真的服了，推荐指数五颗星！",
                    "如果早知道{topic}这么好用，我就能少走很多弯路了。不过话说回来，人生就是要不断试错嘛。总之现在它已经成为我生活中不可或缺的一部分了！"
                ],
                literary: [
                    "{topic}如同秋日里的一缕暖阳，不张扬却温暖人心。在与它的相处中，我慢慢体会到什么是真正的品质。它教会我，优秀不需要大声喧哗，安静地做好自己就是一种力量。",
                    "遇见{topic}是一场美丽的意外。它以最优雅的姿态走进我的生活，像一个老朋友，不言不语却懂得我所有的心事。在这个喧嚣的世界里，这样的存在弥足珍贵。",
                    "{topic}写着一首关于生活的诗。每一个细节都是一行诗句，每一次使用都是一次阅读。它让我明白，最好的作品往往会说话，而我们需要做的，就是静下心来聆听。"
                ]
            }
        };

        return templates[type][style] || templates.moments.casual;
    }

    // 调整长度
    adjustLength(text, length) {
        const lengthLimits = {
            short: 50,
            medium: 150,
            long: 300
        };

        let currentLength = text.length;
        const targetLength = lengthLimits[length];

        // 如果当前长度已经符合要求，直接返回
        if (currentLength <= targetLength) {
            return text;
        }

        // 根据长度类型进行裁剪
        if (length === 'short') {
            return text.substring(0, targetLength - 3) + '...';
        } else if (length === 'medium') {
            // 尝试在句子边界裁剪
            const sentences = text.split(/[。！？.!?]/);
            let result = '';
            for (let sentence of sentences) {
                if ((result + sentence).length <= targetLength) {
                    result += sentence + '。';
                } else {
                    break;
                }
            }
            return result || text.substring(0, targetLength - 3) + '...';
        } else {
            // long：尽量保留完整内容
            return text;
        }
    }

    // 显示结果
    displayResult(text) {
        this.resultText.textContent = text;
        this.resultSection.style.display = 'block';

        // 滚动到结果区域
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // 更新字数
        this.updateWordCount(text);
    }

    // 更新字数
    updateWordCount(text) {
        const count = text.length;
        this.wordCount.textContent = `字数：${count}`;
    }

    // 复制结果
    async copyResult() {
        const text = this.resultText.textContent;
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('复制成功！');
        } catch (err) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('复制成功！');
        }
    }

    // 添加到历史记录
    addToHistory(topic, type, style, text) {
        const typeNames = {
            moments: '朋友圈',
            ad: '广告语',
            article: '短文'
        };

        const styleNames = {
            casual: '轻松活泼',
            professional: '专业正式',
            emotional: '情感共鸣',
            humorous: '幽默风趣',
            literary: '文艺清新'
        };

        const record = {
            id: Date.now(),
            topic,
            type: typeNames[type],
            style: styleNames[style],
            text,
            timestamp: new Date().toISOString()
        };

        this.history.unshift(record);

        // 限制历史记录数量
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }

        this.saveHistory();
        this.renderHistory();
    }

    // 渲染历史记录
    renderHistory() {
        if (this.history.length === 0) {
            this.historySection.style.display = 'none';
            return;
        }

        this.historySection.style.display = 'block';
        this.historyList.innerHTML = '';

        this.history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const date = new Date(record.timestamp);
            const timeStr = this.formatDate(date);

            item.innerHTML = `
                <div class="history-meta">
                    <span class="history-topic">${this.escapeHtml(record.topic)}</span>
                    <span>${timeStr}</span>
                </div>
                <div class="history-tags">
                    <span class="history-tag">${record.type}</span>
                    <span class="history-tag">${record.style}</span>
                </div>
                <div class="history-text">${this.escapeHtml(record.text)}</div>
                <div class="history-actions">
                    <button class="action-btn" onclick="generator.copyHistoryText(${record.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>复制</span>
                    </button>
                    <button class="action-btn" onclick="generator.setFromHistory(${record.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        <span>编辑</span>
                    </button>
                </div>
            `;

            this.historyList.appendChild(item);
        });
    }

    // 从历史记录复制
    async copyHistoryText(id) {
        const record = this.history.find(r => r.id === id);
        if (record) {
            try {
                await navigator.clipboard.writeText(record.text);
                this.showToast('复制成功！');
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = record.text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showToast('复制成功！');
            }
        }
    }

    // 从历史记录编辑
    setFromHistory(id) {
        const record = this.history.find(r => r.id === id);
        if (record) {
            this.topicInput.value = record.topic;
            this.resultText.textContent = record.text;
            this.resultSection.style.display = 'block';
            this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.updateWordCount(record.text);
        }
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            this.showToast('历史记录已清空');
        }
    }

    // 保存历史记录到本地存储
    saveHistory() {
        localStorage.setItem('copywriterHistory', JSON.stringify(this.history));
    }

    // 从本地存储加载历史记录
    loadHistory() {
        const saved = localStorage.getItem('copywriterHistory');
        return saved ? JSON.parse(saved) : [];
    }

    // 设置加载状态
    setLoading(loading) {
        if (loading) {
            this.generateBtn.disabled = true;
            this.generateBtn.innerHTML = `
                <span class="loading"></span>
                <span class="btn-text">生成中...</span>
            `;
        } else {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = `
                <span class="btn-icon">🚀</span>
                <span class="btn-text">立即生成</span>
            `;
        }
    }

    // 显示Toast提示
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2000);
    }

    // 格式化日期
    formatDate(date) {
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        } else {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化应用
const generator = new CopywriterGenerator();