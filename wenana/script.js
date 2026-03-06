// 文案生成器数据
const copywritingData = {
    moments: {
        formal: {
            short: [
                "今日感悟：{topic}，值得深思。",
                "关于{topic}，分享一点心得。",
                "{topic}，带给我新的启发。"
            ],
            medium: [
                "今日份的思考：{topic}。\n\n在这个快速变化的时代，我们常常需要在忙碌中找到平衡。{topic}让我意识到，生活的美好往往藏在细节里。\n\n愿我们都能在平凡中发现不平凡。✨",
                "分享一些关于{topic}的想法：\n\n经过这段时间的沉淀，我发现{topic}其实与我们的生活息息相关。它不仅仅是表面的现象，更是一种生活态度的体现。\n\n希望大家有所收获～",
                "💭 关于{topic}的思考\n\n我们常说细节决定成败，{topic}正是这样一个需要我们用心体会的话题。\n\n每一次深入思考，都能带来新的视角。共勉！"
            ],
            long: [
                "🌟 今日分享：关于{topic}的一些思考\n\n生活就像一本书，每一天都是新的一页。今天想和大家聊聊{topic}这个话题。\n\n首先，{topic}让我重新审视了自己的生活节奏。在这个信息爆炸的时代，我们往往被各种琐事困扰，却忽略了最重要的事情。\n\n其次，我意识到{topic}其实是一种生活哲学。它教会我们如何在复杂中保持简单，在忙碌中保持从容，在变化中保持本心。\n\n最后，{topic}提醒我们要珍惜当下。每一刻都是独一无二的，每一秒都值得被认真对待。\n\n希望这些思考能给大家一些启发。如果你也有类似的感悟，欢迎在评论区分享～\n\n#生活感悟 #{topic}"
            ]
        },
        casual: {
            short: [
                "今天{topic}有感～",
                "{topic}哈哈哈哈",
                "关于{topic}，说点什么好呢"
            ],
            medium: [
                "聊聊{topic}这事儿🤔\n\n说实话，之前没太关注，最近才发现真的很有意思！\n\n你们怎么看？",
                "今天的{topic}真的绝了😂\n\n谁懂啊，这种感觉太真实了\n\n有没有同感的宝子",
                "碎碎念时间⏰\n\n关于{topic}，我真的有太多话想说\n\n总之就是，懂的都懂\n\n#日常分享"
            ],
            long: [
                "宝子们！今天必须聊聊{topic}！！\n\n事情是这样的，最近我真的被{topic}这个问题困扰了好久😭 试过各种方法，踩过各种坑...\n\n但是！！经过这段时间的摸索，我终于悟出了几条心得：\n1️⃣ 原来{topic}这么讲究\n2️⃣ 之前的我太天真了\n3️⃣ 现在的方法真的香\n\n真心建议大家如果遇到{topic}相关问题，一定多看看、多试试～\n\n有相同经历的小伙伴快来评论区集合！让我看看有多少同道中人🙋‍♀️\n\n#经验分享 #生活tips"
            ]
        },
        humorous: {
            short: [
                "{topic}？我选择躺平😎",
                "关于{topic}，我人麻了",
                "{topic}这种事，谁懂啊"
            ],
            medium: [
                "{topic}的真实写照：\n\n我：我想{topic}\n现实：你确定？\n我：那算了\n\n完美解决👌",
                "论{topic}的自我修养：\n\n第一步：想想{topic}\n第二步：算了不{topic}了\n第三步：但是还是想{topic}\n第四步：无限循环\n\n这就是我的{topic}日常😂",
                "{topic}的时候我才发现：\n\n原来我是个天才\n（在{topic}这件事上翻车这件事上）\n\n家人们谁懂啊😭"
            ],
            long: [
                "【关于{topic}的研究报告】\n\n📊 研究对象：我和{topic}\n📊 研究方法：反复尝试\n📊 研究结论：{topic}是一个玄学\n\n详细分析：\n\n第一阶段：自信满满准备搞定{topic}\n结果：小场面，拿捏！\n\n第二阶段：开始{topic}\n结果：等等，好像哪里不对...\n\n第三阶段：{topic}中\n结果：我到底在干什么？\n\n第四阶段：放弃{topic}\n结果：下次一定！\n\n综上所述，{topic}是一个需要天赋的事情，而我，显然选择了另一条路——躺平🛌\n\n#人间真实 #{topic}"
            ]
        },
        emotional: {
            short: [
                "{topic}，触动心弦✨",
                "今日{topic}，心生感慨",
                "关于{topic}，想说的话"
            ],
            medium: [
                "今晚聊聊{topic}吧🌙\n\n有些话，想说很久了。{topic}让我明白了很多事。\n\n愿你我都能温柔地对待世界。",
                "关于{topic}的感悟💭\n\n生活中有太多美好的时刻，而{topic}就是其中之一。\n\n感恩遇见的一切。",
                "深夜话{topic}\n\n有时候一句话就能触动内心，{topic}正是如此。\n\n愿我们都被世界温柔以待🌸"
            ],
            long: [
                "🌸 关于{topic}，想说很久了\n\n有些话题，总在深夜里尤为清晰。{topic}就是这样一个存在。\n\n回想起过去的点点滴滴，{topic}像一束光，照亮了某些被遗忘的角落。它让我想起那些温暖的人、温柔的事，还有那些藏在时光缝隙中的小确幸。\n\n或许成长的意义，就在于学会{topic}。不是刻意追求，而是在某个瞬间突然懂了，原来生活可以这样过，原来可以这样温柔地对待自己和他人。\n\n如果此刻的你也正为{topic}所触动，不妨停下来，深呼吸，感受这份美好。\n\n愿你今晚好梦，愿你被世界温柔以待。🌙✨\n\n#心路历程 #{topic}"
            ]
        },
        professional: {
            short: [
                "专业解读：{topic}",
                "关于{topic}的关键要点",
                "{topic}：行业洞察"
            ],
            medium: [
                "【{topic}专题】\n\n核心要点：\n1. 市场趋势已现\n2. 用户需求明确\n3. 解决方案成熟\n\n欢迎交流探讨～",
                "关于{topic}的几点思考：\n\n经过深入分析，我们认为{topic}将成为新的增长点。\n\n关键在于执行力与策略的平衡。",
                "💼 行业动态：{topic}\n\n最新数据显示，{topic}领域持续升温。\n\n建议关注以下几个方面的发展..."
            ],
            long: [
                "【{topic}深度分析】\n\n一、背景概述\n\n当前环境下，{topic}已成为行业发展的重要关键词。数据显示，相关市场规模持续扩大，用户认知度显著提升。\n\n二、核心洞察\n\n1. 市场层面：{topic}需求呈现多元化特征\n2. 用户层面：对{topic}的期待更加具体化\n3. 技术层面：创新应用不断涌现\n\n三、机会与挑战\n\n机会：\n- 政策支持力度加大\n- 用户教育成本降低\n- 商业模式日趋成熟\n\n挑战：\n- 竞争加剧\n- 同质化风险\n- 盈利压力\n\n四、建议与展望\n\n建议持续关注{topic}领域的发展动态，结合自身优势寻找切入点。\n\n欢迎同行交流探讨！\n\n#行业分析 #{topic}"
            ]
        }
    },
    ad: {
        formal: {
            short: [
                "{theme}，值得信赖。",
                "{theme}——您的品质之选。",
                "{theme}，专业铸就卓越。"
            ],
            medium: [
                "🌟 {theme}\n\n专业品质，值得信赖。\n\n选择我们，选择放心。",
                "【{theme}】\n\n✓ 专注品质\n✓ 用心服务\n✓ 值得托付\n\n立即咨询了解详情。",
                "{theme}，让专业成为标准。\n\n多年来，我们始终坚持以品质为核心，为客户创造价值。\n\n期待与您合作。"
            ],
            long: [
                "【{theme}】—— 专注品质，服务至上\n\n📌 关于我们\n\n我们是一家专注于{theme}领域的专业团队，拥有多年行业经验和强大的技术实力。\n\n🎯 核心优势\n\n• 专业团队：经验丰富的专家团队\n• 品质保证：严格的质量控制体系\n• 完善服务：从咨询到售后的一站式服务\n• 创新能力：持续的技术研发投入\n\n💼 服务承诺\n\n✅ 24小时响应\n✅ 定制化解决方案\n✅ 全程跟踪服务\n✅ 满意度保障\n\n📞 联系我们\n\n我们期待为您服务！\n\n#品质服务 #专业{theme}"
            ]
        },
        casual: {
            short: [
                "{theme}！就选这个没错～",
                "姐妹们，{theme}真的绝了",
                "挖到宝了！{theme}"
            ],
            medium: [
                "必须要安利这个{theme}！！\n\n真的太好用了😭 用过都说好！\n\n姐妹们快冲！",
                "关于{theme}的真相🤔\n\n试了一圈，这个是真的香！\n\n不信你试试～",
                "分享个好东西：{theme}\n\n用了一段时间，真心推荐！\n\n#好物推荐"
            ],
            long: [
                "姐妹们！！我必须要安利这个{theme}！！\n\n作为一个非常挑剔的人，我试过无数产品之后，终于找到了真爱💕\n\n【使用感受】\n\n第一次用就惊艳到我了！\n✨ 效果立竿见影\n✨ 性价比超高\n✨ 用完还想回购\n\n【对比其他家】\n\n之前也用过类似的，但是{theme}真的不一样！不管是质量还是体验都完胜～\n\n【小Tips】\n\n使用的时候注意这些细节效果更好哦～具体可以私信问我～\n\n总之，{theme}真的值得一试！用过的小伙伴都来反馈说好！\n\n姐妹们快冲！手慢无～🏃‍♀️💨\n\n#真实测评 #良心推荐"
            ]
        },
        humorous: {
            short: [
                "{theme}？真香警告！",
                "本来看不上{theme}，现在打脸了",
                "{theme}：我可以！"
            ],
            medium: [
                "关于{theme}这事...\n\n我：这就这？\n用完后：真香！\n\n大型真香现场😂",
                "谁懂啊，{theme}居然这么好用\n\n我的钱包已就位💰\n\n#真香定律",
                "{theme}使用心得：\n\n之前：不太需要\n现在：离不开\n\n这就是真香的力量🤷"
            ],
            long: [
                "【{theme}真香实录】\n\n📅 使用前\n\n我：{theme}？不太需要吧，真的有说的那么好吗？\n理性的我决定保持冷静。\n\n📅 入手后\n\n我：就试试看...\n五分钟后：嗯？有点意思\n十分钟后：这什么神仙{theme}！！\n半小时后：我为什么没有早点发现它！！\n\n📅 现状\n\n家人问我：你怎么天天在用{theme}？\n我：你不懂，这是真爱💕\n钱包：😭 我不想走\n我：{theme}值得！\n\n【总结】\n\n{theme}这玩意儿用一次就离不开，建议钱包做好心理准备再入！\n\n不过说真的，真香！！\n\n#真香警告 #{theme}"
            ]
        },
        emotional: {
            short: [
                "{theme}，温暖你的心",
                "遇见{theme}，遇见美好",
                "{theme}，一份温暖的礼物"
            ],
            medium: [
                "有时候，幸福就是遇见{theme}✨\n\n愿这份美好与你同在。",
                "关于{theme}\n\n它不仅仅是一个选择，更是一份心意。\n\n愿温暖常伴左右🌸",
                "分享一个温暖的故事：{theme}\n\n愿每一个美好的瞬间都被珍惜。\n\n#温暖时刻"
            ],
            long: [
                "✨ 写给懂{theme}的你\n\n有些遇见，是时间给予的礼物。{theme}就是这样一种存在。\n\n记得第一次接触{theme}时，那种被温柔以待的感觉至今难忘。就像春风拂过心湖，荡起层层涟漪。\n\n生活需要仪式感，更需要这些能触动内心的瞬间。{theme}带给我们的不仅是产品的价值，更是一种对生活态度的诠释。\n\n愿你在使用{theme}的每一个时刻，都能感受到这份用心。愿这份温暖能传递给更多人。\n\n因为懂得，所以珍贵。\n\n感恩每一份相遇，感谢每一次选择。\n\n愿{theme}成为你生活中的一束光。🌟\n\n#温暖 #心意"
            ]
        },
        professional: {
            short: [
                "{theme}——行业标杆",
                "{theme}，专业之选",
                "信赖{theme}，信赖专业"
            ],
            medium: [
                "【{theme}】\n\n专注行业多年，服务客户无数。\n\n专业铸就品质，实力赢得信赖。",
                "关于{theme}\n\n市场验证，客户认可。\n\n期待与您合作共赢。\n\n#专业{theme}",
                "选择{theme}的三大理由：\n\n1. 行业领先\n2. 品质保证\n3. 服务完善\n\n了解详情，欢迎咨询。"
            ],
            long: [
                "【{theme}】—— 您值得信赖的合作伙伴\n\n🎯 企业简介\n\n我们专注于{theme}领域，致力于为客户提供专业的解决方案。凭借多年的行业积累和技术沉淀，已成为行业内的领军企业。\n\n💪 核心实力\n\n行业经验：10+年深耕{theme}领域\n技术团队：由行业专家组成的精英团队\n服务客户：累计服务客户10000+\n成功案例：覆盖多个行业领域\n\n🏆 成功案例\n\n案例一：某知名企业{theme}项目\n成果：效率提升40%，成本降低30%\n\n案例二：某行业龙头{theme}升级\n成果：满意度98%，续约率100%\n\n🤝 合作优势\n\n成熟完善的服务体系\n定制化的解决方案\n专业的技术支持\n全程无忧的售后保障\n\n📞 商务合作\n\n我们期待与您携手共创未来！\n\n联系我们获取专属方案。\n\n#{theme} #专业服务"
            ]
        }
    },
    article: {
        formal: {
            short: [
                "关于{topic}的几点思考。",
                "{topic}：从一个角度分析。",
                "浅析{topic}的现状与发展。"
            ],
            medium: [
                "【{topic}】\n\n经过深入思考，我认为{topic}的核心在于把握关键环节。\n\n首先，需要明确目标。其次，要注重执行。最后，持续优化不可或缺。\n\n这是一个系统工程，需要统筹规划。\n\n希望这些思考对大家有所启发。",
                "关于{topic}的分析\n\n从宏观层面看，{topic}呈现出良好的发展态势。\n\n从微观层面看，仍有一些问题需要解决。\n\n关键在于平衡各方需求，寻找最优解。\n\n这需要时间和耐心。",
                "【{topic}专题】\n\n近期，{topic}成为热议话题。\n经过梳理和分析，我总结了以下几个要点：\n\n1. 趋势向好\n2. 挑战并存\n3. 机遇可期\n\n相信随着各方的共同努力，{topic}会迎来更好的发展。\n\n让我们拭目以待。"
            ],
            long: [
                "关于{topic}的深度思考\n\n前言\n\n在当前环境下，{topic}已成为一个不容忽视的重要议题。本文将从多个维度展开分析，试图提供一个更加全面的视角。\n\n一、现状分析\n\n从数据来看，{topic}的市场需求持续增长，用户认知度不断提升。这说明{topic}已经进入了发展的快车道。\n\n但同时我们也要看到，发展中还存在一些问题：标准不统一、服务体系不完善、用户体验参差不齐等。\n\n二、核心挑战\n\n1. 如何建立标准化体系\n2. 如何提升服务质量\n3. 如何满足多样化需求\n\n三、发展建议\n\n针对上述挑战，我认为应该从以下几个方面着手：\n\n第一，完善行业规范。建立统一的标准体系是行业健康发展的基础。\n\n第二，加强人才培养。人才是第一资源，需要建立完善的人才培养机制。\n\n第三，鼓励创新发展。创新是发展的动力，应该为创新提供良好的环境。\n\n四、未来展望\n\n展望未来，{topic}的发展前景广阔。随着技术的进步和用户需求的变化，{topic}将呈现出新的特点和趋势。\n\n我们有理由相信，通过各方的共同努力，{topic}将迎来更加美好的明天。\n\n结语\n\n{topic}的发展之路还很长，需要我们共同探索、持续创新。\n\n愿本文的分析能够为相关从业者提供一些参考价值。"
            ]
        },
        casual: {
            short: [
                "聊聊{topic}这事儿～",
                "{topic}有感而发",
                "关于{topic}的一些碎碎念"
            ],
            medium: [
                "今天想聊聊{topic}🤔\n\n说实话，之前没怎么关注过，最近接触下来发现还蛮有意思的！\n\n感觉{topic}真的和我们的生活息息相关。\n\n你们怎么看？",
                "碎碎念时间：关于{topic}\n\n最近真的被{topic}刷屏了...\n\n不过仔细想想，确实挺有道理的。\n\n分享一下我的感受～\n\n✨ 简单讲就是，{topic}这事儿吧，真的看个人。每个人的情况不一样，感受也不一样。\n\n反正我是还蛮喜欢的～",
                "关于{topic}的几点想法\n\n最近在思考{topic}的问题，有一些感悟想分享：\n\n首先，{topic}其实没那么复杂\n\n其次，心态很重要\n\n最后，别太纠结细节\n\n希望能帮到有需要的朋友～"
            ],
            long: [
                "关于{topic}，我想说很久了\n\n大家好，今天想和大家聊一个话题：{topic}\n\n为什么聊这个呢？因为最近我发现身边好多朋友都在讨论{topic}，但似乎每个人理解的都不太一样。所以想分享一些我的想法。\n\n【我的{topic}经历】\n\n说实话，最开始我对{topic}也没什么概念。就是某天突然被朋友安利了一下，说这个{topic}真的挺有意思的。\n\n我一开始是抱着试试看的心态，结果...真香了！😂\n\n【{topic}到底好在哪里】\n\n我个人觉得，{topic}最大的优点就是简单直接。不需要太多准备，也不用很复杂的过程，就是很自然的那种感觉。\n\n而且吧，{topic}还蛮有意思的，每次都能有点新的体验。\n\n【一些建议】\n\n如果你也对{topic}感兴趣，我有几个小建议：\n\n1. 别想太多，直接试试\n2. 保持开放的心态\n3. 多和同好交流\n4. 找到适合自己的节奏\n\n【最后想说】\n\n总的来说，{topic}这事儿吧，还真是看个人。有人喜欢，有人不感冒，这都正常。\n\n关键是找到适合自己的，别盲目跟风。\n\n好啦，今天的分享就到这里～希望能帮到大家！\n\n有问题欢迎评论区交流呀～\n\n#{topic} #经验分享"
            ]
        },
        humorous: {
            short: [
                "{topic}？我看行！",
                "关于{topic}的沙雕想法",
                "{topic}大赏"
            ],
            medium: [
                "今日份{topic}感想🤔\n\n总结就是：\n\n我：我要{topic}\n现实：确定吗？\n我：那我先看看\n现实：好的继续看\n我：那算了\n\n完美的{topic}流程✅",
                "聊一聊{topic}\n\n经过严谨的科学实验（我瞎琢磨的），我得出一个结论：\n\n{topic}这事儿，主打一个随心所欲～\n\n就是这么草率😎",
                "【{topic}观察报告】\n\n研究对象：我和{topic}\n研究结果：{topic}就是个圈\n\n研究过程：\n第一步：想{topic}\n第二步：准备{topic}\n第三步：继续准备\n第四步：算了明天再说\n\n论文结论：拖延症晚期没救了\n\n谢谢大家🙏"
            ],
            long: [
                "{topic}生存指南（伪）\n\n大家好，今天来聊一个很严肃的话题——{topic}\n\n【前情提要】\n\n作为一个在{topic}领域摸爬滚打（其实是躺平）多年的人，我觉得有必要分享一下我的宝贵经验。\n\n【{topic}的几个阶段】\n\n🌱 萌芽期\n这时候的你对{topic}充满好奇，觉得{topic}好简单，完全没有难度。\n\n🔥 热血期\n开始了解{topic}，觉得{topic}很有意思，每天都要搞一搞。\n\n📉 疲惫期\n{topic}搞了半天没啥进展，开始怀疑人生。\n\n💀 躺平期\n{topic}太难了，我选择放弃（不是）\n\n🌟 顿悟期\n突然发现了{topic}的真谛！\n\n🤔 假顿悟期\n发现刚才那个顿悟是错觉，继续回去研究{topic}。\n\n【我的心得】\n\n经过长期观察（瞎琢磨），我发现{topic}的核心奥秘就是：\n\n看！心！情！\n\n心情好：{topic}真有意思\n心情不好：{topic}是个啥\n\n【总结】\n\n以上就是我对{topic}的不正经分析。\n\n总之，{topic}这事儿吧，别太纠结，开心最重要～\n\n当然，以上纯属个人观点，如有雷同，纯属巧合；如有不同，你是对的！\n\n#{topic} #瞎说什么大实话"
            ]
        },
        emotional: {
            short: [
                "{topic}，给我温暖",
                "关于{topic}的心声",
                "{topic}触动心弦"
            ],
            medium: [
                "今晚想聊聊{topic}🌙\n\n有些话题，总在某些时刻特别清晰。\n\n{topic}对我来说就是这样。\n\n或许很多人不理解，但{topic}确实触动了我的内心。\n\n愿我们都能找到属于自己的{topic}。",
                "关于{topic}的感悟\n\n有时候，一个简单的{topic}就能带来很多力量。\n\n它让我意识到，生活中的美好往往藏在那些不经意的瞬间。\n\n愿我们都能温柔地对待每一天。",
                "分享一些关于{topic}的感受\n\n最近在思考{topic}这个话题，感慨良多。\n\n{topic}就像一面镜子，让我们看到真实的自己。\n\n在这个过程中，我学会了接纳、学会感恩、学会了与生活和解。\n\n谢谢{topic}，带给我这些感悟。✨"
            ],
            long: [
                "关于{topic}的心路历程\n\n【序】\n\n有些话，想说很久了。关于{topic}，关于那些藏在时光里的感受。\n\n【遇见】\n\n第一次接触{topic}时，并没有太多的想法。就像生活中无数次普通的遇见，平淡无奇。\n\n但谁能想到，这竟是一个温柔的开始。\n\n【感悟】\n\n慢慢地，{topic}开始渗透进我的生活。像一束光，照亮了某些被遗忘的角落。\n\n我开始思考：为什么{topic}会带来这样的感受？\n\n后来我明白，真正打动人的，是{topic}背后的那份真诚。它让我想起了那些温暖的瞬间，那些被生活磨平却从未消失的柔软。\n\n【成长】\n\n在与{topic}相伴的日子里，我学到了很多。\n\n学会了慢下来，学会感受生活中的小确幸，学会与不完美的自己和解。\n\n这些都是{topic}赠予我的礼物。\n\n【感谢】\n\n感恩遇见{topic}，感恩这段心路历程。\n\n愿文字能传递这份温暖，愿读到这里你，也能感受到这份美好。\n\n或许，我们都在寻找属于自己的{topic}。这个过程或许漫长，或许曲折，但终会相遇。\n\n愿你我都能温柔地对待世界，也被世界温柔以待。🌸\n\n#{topic} #心路历程"
            ]
        },
        professional: {
            short: [
                "浅析{topic}的发展趋势",
                "关于{topic}的专业见解",
                "{topic}：现状与展望"
            ],
            medium: [
                "【{topic}分析报告】\n\n一、市场现状\n\n{topic}市场需求持续增长，用户规模不断扩大。\n\n二、核心洞察\n\n1. 用户认知度提升\n2. 服务质量改善\n3. 创新应用涌现\n\n三、发展建议\n\n建议持续关注{topic}领域的创新趋势，加强服务能力建设。\n\n我们将持续跟踪{topic}的发展动态。",
                "{topic}专题研究\n\n研究背景：\n\n{topic}已成为行业关注的焦点，有必要进行系统分析。\n\n研究方法：\n\n数据分析 + 用户调研 + 专家访谈\n\n主要发现：\n\n1. 市场潜力巨大\n2. 用户需求明确\n3. 解决方案成熟\n\n建议关注相关机会。",
                "关于{topic}的行业观察\n\n近期{topic}领域动态频繁，值得重点关注。\n\n从市场数据来看，{topic}呈现以下特点：\n\n增长稳定、需求多样、创新活跃\n\n建议从业者把握机遇，提升服务质量。\n\n我们将持续关注并向客户提供最新洞察。"
            ],
            long: [
                "【{topic}行业研究报告】\n\n摘要\n\n本报告对{topic}领域进行了系统性分析，旨在为相关从业者和投资者提供参考。\n\n一、行业背景\n\n1.1 发展现状\n\n{topic}行业近年来保持稳定增长态势，市场规模持续扩大。数据显示，过去三年市场复合增长率达到XX%。\n\n1.2 驱动因素\n\n政策支持、技术进步、需求升级共同推动了{topic}行业的发展。\n\n二、市场分析\n\n2.1 用户画像\n\n核心用户群体为XX-XX岁，主要集中在一二线城市，具有较高的消费能力和使用意愿。\n\n2.2 需求特点\n\n品质化、个性化、场景化成为主要需求特征。\n\n2.3 竞争格局\n\n市场呈现XX格局，头部企业优势明显，但细分领域仍有创新空间。\n\n三、核心洞察\n\n3.1 发展机遇\n\n• 市场教育逐步成熟\n• 技术创新降低成本\n• 政策环境持续优化\n\n3.2 面临挑战\n\n• 同质化竞争加剧\n• 盈利压力增大\n• 用户体验期望提升\n\n四、趋势展望\n\n4.1 产品趋势\n\n智能化、个性化、场景化将成为产品发展重点。\n\n4.2 技术趋势\n\nAI、大数据等技术将深度融入{topic}应用场景。\n\n4.3 商业模式\n\n从单一产品向综合服务转型，构建生态体系。\n\n五、建议与展望\n\n对于行业从业者，建议聚焦核心能力建设，提升服务质量，加强技术创新。\n\n对于投资者，建议关注具有技术优势和用户基础的平台型企业。\n\n\n结语\n\n{topic}行业正处于快速发展期，未来发展空间广阔。我们将持续关注行业动态，为相关方提供有价值的信息和洞察。\n\n\n免责声明：本报告仅供参考，不构成投资建议。\n\n#{topic} #行业研究"
            ]
        }
    }
};

// DOM 元素
const topicInput = document.getElementById('topic');
const typeSelect = document.getElementById('type');
const styleSelect = document.getElementById('style');
const lengthInput = document.getElementById('length');
const generateBtn = document.getElementById('generateBtn');
const resultContent = document.getElementById('resultContent');
const copyBtn = document.getElementById('copyBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const toast = document.getElementById('toast');

// 状态
let history = JSON.parse(localStorage.getItem('copywritingHistory') || '[]');

// 初始化
function init() {
    setupEventListeners();
    renderHistory();
}

// 设置事件监听
function setupEventListeners() {
    // 字数选择
    document.querySelectorAll('.length-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            lengthInput.value = btn.dataset.length;
        });
    });

    // 生成按钮
    generateBtn.addEventListener('click', generateCopywriting);

    // 复制按钮
    copyBtn.addEventListener('click', copyToClipboard);

    // 重新生成
    regenerateBtn.addEventListener('click', generateCopywriting);

    // 清空历史
    clearHistoryBtn.addEventListener('click', clearHistory);

    // 输入框回车生成
    topicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateCopywriting();
        }
    });
}

// 生成文案
function generateCopywriting() {
    const topic = topicInput.value.trim();
    if (!topic) {
        showToast('请输入主题', 'error');
        return;
    }

    const type = typeSelect.value;
    const style = styleSelect.value;
    const length = lengthInput.value;

    // 显示加载状态
    setLoading(true);

    // 模拟 AI 生成延迟
    setTimeout(() => {
        const result = getCopywriting(type, style, length, topic);
        displayResult(result);
        saveToHistory(result, topic, type, style, length);
        setLoading(false);
        showToast('文案生成成功！', 'success');
    }, 800);
}

// 获取文案
function getCopywriting(type, style, length, topic) {
    const data = copywritingData[type]?.[style]?.[length];
    if (!data) return '抱歉，暂时无法生成该类型的文案。';

    const templates = data;
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex].replace(/{topic}|{theme}/g, topic);
}

// 显示结果
function displayResult(content) {
    resultContent.textContent = content;
}

// 复制到剪贴板
async function copyToClipboard() {
    const text = resultContent.textContent;
    if (!text || text === '请输入主题并点击生成按钮') {
        showToast('没有可复制的内容', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板！', 'success');
    } catch (err) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('已复制到剪贴板！', 'success');
    }
}

// 保存到历史
function saveToHistory(content, topic, type, style, length) {
    const typeNames = { moments: '朋友圈', ad: '广告语', article: '短文' };
    const styleNames = { formal: '正式', casual: '轻松', humorous: '幽默', emotional: '感性', professional: '专业' };
    const lengthNames = { short: '短', medium: '中', long: '长' };

    const item = {
        id: Date.now(),
        content,
        topic,
        type: typeNames[type],
        style: styleNames[style],
        length: lengthNames[length],
        timestamp: new Date().toLocaleString()
    };

    history.unshift(item);
    if (history.length > 20) {
        history = history.slice(0, 20);
    }

    localStorage.setItem('copywritingHistory', JSON.stringify(history));
    renderHistory();
}

// 渲染历史记录
function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="placeholder">暂无历史记录</div>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadFromHistory('${item.id}')">
            <div class="history-item-header">
                <span>${item.type} · ${item.style} · ${item.length}文</span>
                <span>${item.timestamp}</span>
            </div>
            <div class="history-item-content">${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}</div>
            <div class="copy-hint">点击加载</div>
        </div>
    `).join('');
}

// 从历史加载
window.loadFromHistory = function(id) {
    const item = history.find(h => h.id === parseInt(id));
    if (item) {
        displayResult(item.content);
        topicInput.value = item.topic;
        showToast('已从历史记录加载', 'success');
    }
};

// 清空历史
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        history = [];
        localStorage.removeItem('copywritingHistory');
        renderHistory();
        showToast('历史记录已清空', 'success');
    }
}

// 设置加载状态
function setLoading(loading) {
    const btnText = generateBtn.querySelector('.btn-text');
    const loadingText = generateBtn.querySelector('.loading');

    generateBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    loadingText.style.display = loading ? 'inline' : 'none';
}

// 显示提示
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 启动
init();
