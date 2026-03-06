// AI文案生成器 - 主逻辑
class CopywriterAI {
    constructor() {
        this.history = this.loadHistory();
        this.selectedLength = 'short';
        this.init();
    }

    init() {
        // 绑定字数选择按钮
        document.querySelectorAll('.length-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedLength = e.target.dataset.length;
            });
        });

        // 生成按钮
        document.getElementById('generateBtn').addEventListener('click', () => this.generate());

        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResult());

        // 重新生成按钮
        document.getElementById('regenerateBtn').addEventListener('click', () => this.generate());

        // 清空历史按钮
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

        // 渲染历史记录
        this.renderHistory();
    }

    // 生成文案
    async generate() {
        const topic = document.getElementById('topic').value.trim();
        const style = document.getElementById('style').value;
        const type = document.getElementById('type').value;

        if (!topic) {
            this.showToast('请输入文案主题', 'error');
            return;
        }

        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span>⏳ 生成中...</span>';

        try {
            // 模拟AI生成（实际使用时替换为真实API调用）
            const content = await this.simulateGeneration(topic, style, type, this.selectedLength);

            // 显示结果
            this.displayResult(content);

            // 保存到历史记录
            this.addToHistory(topic, style, type, this.selectedLength, content);

            this.showToast('文案生成成功！', 'success');
        } catch (error) {
            this.showToast('生成失败，请重试', 'error');
            console.error(error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span>🚀 生成文案</span>';
        }
    }

    // 模拟AI生成（示例算法）
    async simulateGeneration(topic, style, type, length) {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const styleConfig = {
            casual: { prefix: '', emoji: '✨', tone: '轻松活泼的' },
            professional: { prefix: '【干货】', emoji: '💡', tone: '专业的' },
            emotional: { prefix: '', emoji: '💭', tone: '走心的' },
            humorous: { prefix: '', emoji: '😄', tone: '幽默的' },
            literary: { prefix: '', emoji: '🌸', tone: '文艺的' },
            business: { prefix: '【推介】', emoji: '🎯', tone: '商务的' }
        };

        const typeConfig = {
            moment: { name: '朋友圈', short: 30, medium: 75, long: 150 },
            ad: { name: '广告语', short: 20, medium: 50, long: 100 },
            article: { name: '短文', short: 50, medium: 100, long: 200 }
        };

        const config = styleConfig[style];
        const typeInfo = typeConfig[type];
        const targetLength = typeInfo[length];

        // 生成模板内容
        const templates = this.getTemplates(style, type);
        const template = templates[Math.floor(Math.random() * templates.length)];

        let content = template
            .replace(/\{topic\}/g, topic)
            .replace(/\{emoji\}/g, config.emoji)
            .replace(/\{prefix\}/g, config.prefix);

        // 调整长度
        if (content.length > targetLength * 1.5) {
            content = content.substring(0, targetLength) + '...';
        } else if (content.length < targetLength * 0.5) {
            content += this.getPaddingText(style, targetLength - content.length, topic);
        }

        return content.trim();
    }

    // 获取风格模板
    getTemplates(style, type) {
        const templates = {
            casual: {
                moment: [
                    '{prefix}今天{emoji}关于{topic}，想说：生活就是这样，总有意外的惊喜等待着我们！',
                    '分享一个关于{topic}的小发现{emoji}原来日常中最简单的快乐最珍贵！',
                    '{topic}打卡Day N{emoji}保持热爱，奔赴山海，每一天都值得被记录✨'
                ],
                ad: [
                    '{prefix}{topic}，懂你所想{emoji}选它准没错！',
                    '{topic}来袭{emoji}这波真的可以冲！',
                    '关于{topic}，我只推荐这个{emoji}用过都说好！'
                ],
                article: [
                    '{prefix}{topic}：一个小众但值得探索的话题。今天想和大家聊聊，为什么它能在众多选择中脱颖而出。或许答案就在细节中，用心发现，总能找到属于自己的那份独特。'
                ]
            },
            professional: {
                moment: [
                    '{prefix}关于{topic}的一些思考{emoji}专业角度分享，希望对大家有启发。',
                    '{topic}深度解析{emoji}基于经验总结的几点核心要点。'
                ],
                ad: [
                    '{prefix}{topic} - 专业之选，品质保证{emoji}',
                    '{topic}{emoji}用实力说话，让专业成就价值。'
                ],
                article: [
                    '{prefix}{topic}的深度解析。从专业视角来看，这个领域正在经历前所未有的变革。本文将为大家详细拆解其核心要点，并提供实践建议，帮助读者更好地理解和应用。'
                ]
            },
            emotional: {
                moment: [
                    '{topic}让我思考了很久{emoji}有些话，想说给懂的人听。',
                    '深夜emo时刻{emoji}关于{topic}的一些感悟。',
                    '{topic}教会我的事{emoji}成长，往往在一瞬间。'
                ],
                ad: [
                    '{topic}{emoji}触动心弦的选择，只为懂生活的你。',
                    '有些故事，关于{topic}，也关于你{emoji}'
                ],
                article: [
                    '{prefix}{topic}，一个值得被温柔对待的话题。在这个快节奏的时代，我们常常忽略了内心的声音。今天，让我们一起慢下来，聊聊那些藏在生活细节里的真实感受。'
                ]
            },
            humorous: {
                moment: [
                    '{topic}生存指南{emoji}亲测有效，欢迎翻车！',
                    '关于{topic}，我悟了{emoji}虽然有点晚。',
                    '{topic}翻车现场{emoji}下次还敢！'
                ],
                ad: [
                    '{topic}{emoji}要么不出手，一出手就是王者',
                    '笑死{emoji}关于{topic}的真相是这样的'
                ],
                article: [
                    '{prefix}{topic}：一个让人哭笑不得的话题。说起来都是泪，但既然来了，就给大家好好说道说道。保证你看完会心一笑，顺便还学到了点什么。'
                ]
            },
            literary: {
                moment: [
                    '{topic}，藏在时光里的诗意{emoji}',
                    '春日正好，聊聊{topic}{emoji}岁月静好。',
                    '{topic}如诗{emoji}慢品生活，自有滋味。'
                ],
                ad: [
                    '{topic}{emoji}一份来自时光的礼物。',
                    '诗意与品质并存{emoji}{topic}，献给生活的艺术家。'
                ],
                article: [
                    '{prefix}{topic}，如一首悠然的诗，在时光里缓缓流淌。它不仅仅是一个话题，更是一种生活态度的表达。让我们一起品味这份宁静与美好，在喧嚣中找到属于自己的那片诗意天地。'
                ]
            },
            business: {
                moment: [
                    '{prefix}{topic}商业洞察{emoji}价值驱动，创新引领。',
                    '关于{topic}的几点思考{emoji}分享给大家，欢迎交流。'
                ],
                ad: [
                    '{prefix}{topic}{emoji}高端品质，值得信赖。',
                    '{topic}{emoji}为成功者打造的专属选择。'
                ],
                article: [
                    '{prefix}{topic}：从商业角度看，这个领域蕴含着巨大机遇。本文将深入分析市场趋势，剖析成功案例，为从业者和投资者提供有价值的参考与建议。'
                ]
            }
        };

        return templates[style][type] || templates.casual[type];
    }

    // 填充文本以达到目标长度
    getPaddingText(style, targetLength, topic) {
        const padding = {
            casual: ` 更多{topic}相关内容，等你来发掘！`,
            professional: ` 相关{topic}内容，持续更新中。`,
            emotional: ` {topic}的故事，未完待续...`,
            humorous: ` {topic}更多槽点，欢迎补充！`,
            literary: ` {topic}之美，值得用心品味。`,
            business: ` {topic}相关，欢迎咨询交流。`
        };
        return padding[style] || padding.casual;
    }

    // 显示结果
    displayResult(content) {
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.getElementById('resultContent');

        resultContent.textContent = content;
        resultSection.style.display = 'block';

        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 复制结果
    async copyResult() {
        const content = document.getElementById('resultContent').textContent;

        try {
            await navigator.clipboard.writeText(content);
            this.showToast('已复制到剪贴板！', 'success');
        } catch (err) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = content;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('已复制到剪贴板！', 'success');
        }
    }

    // 保存历史记录
    addToHistory(topic, style, type, length, content) {
        const item = {
            id: Date.now(),
            topic,
            style: this.getStyleName(style),
            type: this.getTypeName(type),
            length: this.getLengthName(length),
            content,
            timestamp: new Date().toLocaleString('zh-CN')
        };

        this.history.unshift(item);

        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.saveHistory();
        this.renderHistory();
    }

    // 渲染历史记录
    renderHistory() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="empty-history">暂无历史记录</p>';
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-item-topic">${this.escapeHtml(item.topic)}</span>
                    <span>${item.timestamp}</span>
                </div>
                <div class="history-item-content">${this.escapeHtml(item.content)}</div>
                <div class="history-item-tags">
                    <span class="history-tag">${item.type}</span>
                    <span class="history-tag">${item.style}</span>
                    <span class="history-tag">${item.length}</span>
                </div>
            </div>
        `).join('');

        // 添加点击事件
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const historyItem = this.history.find(h => h.id === id);
                if (historyItem) {
                    this.displayResult(historyItem.content);
                    document.getElementById('topic').value = historyItem.topic;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    // 清空历史
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            this.showToast('历史记录已清空', 'success');
        }
    }

    // 保存历史到本地存储
    saveHistory() {
        localStorage.setItem('copywriter_history', JSON.stringify(this.history));
    }

    // 从本地存储加载历史
    loadHistory() {
        const saved = localStorage.getItem('copywriter_history');
        return saved ? JSON.parse(saved) : [];
    }

    // 获取风格名称
    getStyleName(style) {
        const names = {
            casual: '轻松活泼',
            professional: '专业正式',
            emotional: '情感共鸣',
            humorous: '幽默风趣',
            literary: '文艺清新',
            business: '商务高端'
        };
        return names[style] || style;
    }

    // 获取类型名称
    getTypeName(type) {
        const names = {
            moment: '朋友圈',
            ad: '广告语',
            article: '短文'
        };
        return names[type] || type;
    }

    // 获取长度名称
    getLengthName(length) {
        const names = {
            short: '短文本',
            medium: '中等长度',
            long: '长文本'
        };
        return names[length] || length;
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示提示
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new CopywriterAI();
});
