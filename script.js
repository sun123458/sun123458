// 知识库数据
const plantKnowledge = {
   浇水: {
        keywords: ['浇水', '水', '干', '湿', 'frequency'],
        answers: [
            '💧 **浇水原则：**"见干见湿"是关键！\n\n**通用规则：**\n- 将手指插入土壤2-3cm，感觉干燥再浇水\n- 浇水要浇透，直到水从盆底流出\n- 不同植物需水量差异很大\n\n**常见植物浇水频率：**\n- 🌵 多肉：7-10天一次\n- 🪴 龟背竹：每周1-2次\n- 🍃 绿萝：保持土壤微湿\n- 🌸 蝴蝶兰：保持介质湿润但不积水',
            '🌊 **浇水小贴士：**\n\n1. 避免中午高温时浇水，清晨或傍晚最佳\n2. 使用室温水，避免直接用自来水（可晾晒1-2天）\n3. 叶面如有灰尘可用湿布擦拭\n4. 冬季减少浇水频率，春季植物生长期可适当增加'
        ]
    },
   施肥: {
        keywords: ['施肥', '肥料', '营养', '肥料', '肥'],
        answers: [
            '🌱 **施肥指南：**\n\n**施肥时机：**\n- 春季（3-5月）和秋季（9-11月）是施肥黄金期\n- 夏季高温和冬季休眠期减少或停止施肥\n- 开花前追施磷钾肥\n\n**常见肥料类型：**\n- 💩 有机肥：腐熟的动物粪便、堆肥\n- 💊 复合肥：氮磷钾均衡\n- 💎 液体肥：稀释后使用，见效快\n\n**注意事项：**\n- 薄肥勤施，宁少勿多\n- 施肥后第二天浇一次透水',
            '🧪 **不同植物施肥建议：**\n\n**观叶植物（龟背竹、绿萝）：**\n- 以氮肥为主，促进叶片生长\n- 每月施一次稀薄液肥\n\n**开花植物（蝴蝶兰）：**\n- 孕蕾期增施磷钾肥\n- 花期停止施肥\n\n**多肉植物：**\n- 需肥量少，春秋季偶尔施一次即可\n- 选择低浓度多肉专用肥'
        ]
    },
   光照: {
        keywords: ['光照', '太阳', '阳光', '光', '亮'],
        answers: [
            '☀️ **光照需求指南：**\n\n**喜阳植物：**\n- 🌻 向日葵、茉莉、月季\n- 需要每天6小时以上直射光\n\n**喜阴植物：**\n- 🪴 龟背竹、绿萝、蕨类\n- 散射光或室内明亮处即可\n\n**中性植物：**\n- 🌵 多肉、吊兰\n- 适应性强，半阴或全阳都能适应',
            '🏠 **室内养护光照建议：**\n\n1. **南向窗台：** 光照最强，适合喜阳植物\n2. **东向窗台：** 早晨柔和阳光，适合大多数植物\n3. **西向窗台：** 下午阳光较强，需适当遮阴\n4. **北向窗台：** 光照较弱，适合耐阴植物\n\n💡 冬季光照不足时，可考虑使用植物补光灯'
        ]
    },
   病虫害: {
        keywords: ['虫', '病', '害', '斑点', '发黄', '枯萎', '蚜虫', '红蜘蛛', '白粉'],
        answers: [
            '🐛 **常见病虫害及防治：**\n\n**蚜虫：**\n- 症状：叶片卷曲、有粘液\n- 防治：用湿布擦拭、喷洒肥皂水或吡虫啉\n\n**红蜘蛛：**\n- 症状：叶片有细小红点、网状物\n- 防治：增加湿度、喷施阿维菌素\n\n**白粉病：**\n- 症状：叶片有白色粉末状物\n- 防治：改善通风、喷洒小苏打水',
            '🏥 **植物生病诊断：**\n\n**叶子发黄：**\n- 下部老叶发黄→正常代谢或缺氮\n- 新叶发黄→可能缺铁或水渍\n- 整株发黄→浇水过多或根部问题\n\n**叶子枯萎：**\n- 土壤干燥→缺水\n- 土壤潮湿→烂根\n\n**叶子掉落：**\n- 突然换环境、温度变化大\n- 浇水不当导致'
        ]
    },
   温度: {
        keywords: ['温度', '冷', '热', '冻', '度'],
        answers: [
            '🌡️ **温度管理指南：**\n\n**适宜温度：**\n- 大多数室内植物：15-30℃\n- 热带植物：不低于18℃\n- 多肉：5-35℃都能适应\n\n**注意事项：**\n- 避免冷风吹袭（空调、暖气附近）\n- 冬季注意防冻，移至室内温暖处\n- 夏季高温时注意通风降温',
            '❄️ **季节养护：**\n\n**春季：**\n- 换盆、施肥的最佳时期\n- 逐渐增加浇水频率\n\n**夏季：**\n- 高温时减少施肥\n- 注意遮阴、增加通风\n- 增加空气湿度\n\n**秋季：**\n- 准备过冬，控制浇水\n- 花卉植物可追施磷钾肥\n\n**冬季：**\n- 控制浇水，保持盆土偏干\n- 停止施肥\n- 注意保温防冻'
        ]
    }
};

// 植物详细知识
const plantDetails = {
    '龟背竹': {
        info: '龟背竹原产于墨西哥热带雨林，叶片形状独特如龟背，是非常受欢迎的室内观叶植物。它的叶片随着年龄增长会逐渐开裂，形成独特的孔洞状。',
        tips: ['喜欢散射光，避免阳光直射', '喜欢温暖湿润的环境', '可水培或土培', '定期擦拭叶片保持光泽']
    },
    '多肉植物': {
        info: '多肉植物是指植物的根、茎或叶具有发达的薄壁组织用以储水，在外形上显得肥厚多汁。它们原产于干旱地区，进化出了耐旱的特性。',
        tips: ['宁干勿湿，切忌积水', '需要充足的阳光', '使用疏松透气的土壤', '冬季控制浇水']
    },
    '蝴蝶兰': {
        info: '蝴蝶兰素有"洋兰皇后"的美称，花朵形似蝴蝶，色彩丰富，花期长达3-4个月，是高档室内盆栽花卉。',
        tips: ['使用专用兰花基质', '避免叶心积水', '花期后修剪花茎', '需要良好通风']
    },
    '绿萝': {
        info: '绿萝是天南星科常绿藤本植物，生命力极强，被称为"生命之花"。它不仅能美化环境，还能有效净化空气，吸收甲醛等有害气体。',
        tips: ['生命力强，适应性好', '可土培也可水培', '定期修剪促进分枝', '避免强光直射']
    }
};

// DOM 元素
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');

// 查找匹配的回答
function findAnswer(question) {
    const q = question.toLowerCase();

    // 检查特定植物
    for (const [plant, detail] of Object.entries(plantDetails)) {
        if (q.includes(plant)) {
            let response = `🌿 **${plant}详细介绍**\n\n${detail.info}\n\n💡 **养护要点：**\n`;
            detail.tips.forEach(tip => {
                response += `• ${tip}\n`;
            });
            return response;
        }
    }

    // 检查关键词匹配
    for (const [category, data] of Object.entries(plantKnowledge)) {
        for (const keyword of data.keywords) {
            if (q.includes(keyword)) {
                // 随机选择一个答案
                const answer = data.answers[Math.floor(Math.random() * data.answers.length)];
                return answer;
            }
        }
    }

    // 默认回复
    return `🤔 关于"${question}"的问题，我建议你：\n\n1. 提供更多细节，比如是什么植物遇到了什么问题\n2. 常见问题我可以帮你解答：\n   - 💧 浇水频率和方法\n   - 🌱 施肥技巧\n   - ☀️ 光照需求\n   - 🐛 病虫害防治\n\n请告诉我你想了解的具体内容！`;
}

// 添加消息到聊天
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // 将换行符转换为 <br>，保留格式
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\n/g, '<br>');
    messageContent.innerHTML = `<p>${content}</p>`;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加打字指示器
function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message typing-message';
    messageDiv.id = 'typing';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    messageContent.appendChild(typingIndicator);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 移除打字指示器
function removeTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) {
        typing.remove();
    }
}

// 处理用户输入
function handleUserMessage() {
    const question = chatInput.value.trim();
    if (!question) return;

    // 添加用户消息
    addMessage(question, true);
    chatInput.value = '';

    // 显示打字指示器
    addTypingIndicator();

    // 模拟AI思考延迟
    setTimeout(() => {
        removeTypingIndicator();
        const answer = findAnswer(question);
        addMessage(answer, false);
    }, 800 + Math.random() * 700);
}

// 快捷提问
function askQuestion(question) {
    chatInput.value = question;
    handleUserMessage();
}

// 事件监听
sendBtn.addEventListener('click', handleUserMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserMessage();
    }
});

// 植物卡片点击事件
document.querySelectorAll('.plant-card').forEach(card => {
    card.addEventListener('click', () => {
        const plantName = card.querySelector('h3').textContent;
        const question = `${plantName}怎么养护？`;
        askQuestion(question);
    });
});

// 页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    chatInput.focus();
});
