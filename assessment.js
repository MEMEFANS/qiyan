(function () {
  const domains = [
    {
      id: "preAssessment",
      code: "PRE",
      label: "预评估",
      group: "筛查/预评估",
      color: "#0891b2",
      description: "正式施测前的语言、理解、叙事与学习准备快速观察。"
    },
    {
      id: "cognitive",
      code: "CVP",
      label: "认知/语言前技能",
      group: "表现测验",
      color: "#f97316",
      description: "问题解决、配对分类、象征性理解、学习准备与任务坚持。"
    },
    {
      id: "expressive",
      code: "EL",
      label: "表达语言",
      group: "表现测验",
      color: "#0ea5e9",
      description: "自发表达、功能性沟通、词句表达与语用表达。"
    },
    {
      id: "receptive",
      code: "RL",
      label: "理解语言",
      group: "表现测验",
      color: "#14b8a6",
      description: "词汇理解、指令理解、情境理解与听觉注意。"
    },
    {
      id: "fineMotor",
      code: "FM",
      label: "精细动作",
      group: "表现测验",
      color: "#8b5cf6",
      description: "抓握、操作、双手协调、书写前技能与工具使用。"
    },
    {
      id: "grossMotor",
      code: "GM",
      label: "粗大动作",
      group: "表现测验",
      color: "#22c55e",
      description: "姿势控制、平衡、协调、运动计划与身体使用。"
    },
    {
      id: "visualMotor",
      code: "VMI",
      label: "视觉动作模仿",
      group: "表现测验",
      color: "#eab308",
      description: "视觉追踪、动作模仿、建构模仿与眼手协调。"
    },
    {
      id: "affective",
      code: "AE",
      label: "情感表达",
      group: "行为观察",
      color: "#ef4444",
      description: "情绪表达、情绪调节、共享情绪与互动中的情感质量。"
    },
    {
      id: "social",
      code: "SR",
      label: "社交互惠",
      group: "行为观察",
      color: "#06b6d4",
      description: "眼神、回应、轮替、共同注意、同伴/成人互动。"
    },
    {
      id: "motorBehavior",
      code: "CMB",
      label: "动作行为特征",
      group: "行为观察",
      color: "#64748b",
      description: "刻板动作、感官寻求/回避、转换困难与动作自我调节。"
    },
    {
      id: "verbalBehavior",
      code: "CVB",
      label: "语言行为特征",
      group: "行为观察",
      color: "#ec4899",
      description: "重复语言、非功能性发声、沟通意图与语用灵活性。"
    },
    {
      id: "problemBehavior",
      code: "PB",
      label: "问题行为",
      group: "照护者报告",
      color: "#dc2626",
      description: "家长报告的安全风险、干扰行为、情绪行为与日常管理压力。"
    },
    {
      id: "selfCare",
      code: "PSC",
      label: "个人生活自理",
      group: "照护者报告",
      color: "#84cc16",
      description: "进食、穿脱、如厕、睡眠、日常例行与安全意识。"
    },
    {
      id: "adaptive",
      code: "AB",
      label: "适应行为",
      group: "照护者报告",
      color: "#f59e0b",
      description: "家庭/学校适应、规则理解、等待、转换与环境参与。"
    }
  ];

  const domainMap = Object.fromEntries(domains.map((domain) => [domain.id, domain]));
  const assessmentPackages = {
    pep3: {
      label: "PEP-3结构总评估",
      domains: ["cognitive", "expressive", "receptive", "fineMotor", "grossMotor", "visualMotor", "affective", "social", "motorBehavior", "verbalBehavior", "problemBehavior", "selfCare", "adaptive"]
    },
    performance: {
      label: "表现测验",
      domains: ["cognitive", "expressive", "receptive", "fineMotor", "grossMotor", "visualMotor", "affective", "social", "motorBehavior", "verbalBehavior"]
    },
    caregiver: {
      label: "照护者报告",
      domains: ["problemBehavior", "selfCare", "adaptive"]
    },
    communication: {
      label: "沟通组合",
      domains: ["cognitive", "expressive", "receptive"]
    },
    motor: {
      label: "动作组合",
      domains: ["fineMotor", "grossMotor", "visualMotor"]
    },
    maladaptive: {
      label: "行为特征组合",
      domains: ["affective", "social", "motorBehavior", "verbalBehavior"]
    },
    pre: {
      label: "快速预评估",
      domains: ["preAssessment"]
    }
  };
  let activeDomain = "cognitive";
  let activePackage = "pep3";
  let activeStep = "profile";
  let activeItemIndex = 0;
  let expandedItemIds = new Set();
  let assessmentItems = [];

  const fieldIds = [
    "assessmentPackage",
    "recordId",
    "childName",
    "childSex",
    "birthDate",
    "assessmentDate",
    "childAgeMonths",
    "guardianName",
    "guardianPhone",
    "primaryConcern",
    "examiner",
    "site",
    "medicalHistory",
    "educationHistory",
    "instrumentName",
    "licenseNote",
    "assessmentMode",
    "caregiverSummary",
    "observationSummary",
    "clinicalImpression",
    "interventionPlan"
  ];

  const starterItems = [
    {
      domain: "preAssessment",
      title: "第1题：看图叙事",
      prompt: "孩子能否参照着有图画的故事书，用3到4句话简单地讲述一个故事？可以每一页故事书都用一句话描述。",
      administration: "成人先示范，对照故事书讲完一个故事后，观察孩子能否同样对照故事书用3到4句话讲完。无需一次性把故事说完，可以逐页出示，让孩子一页一句描述。",
      criteria: "能够参照绘本讲述，内容涉及人物、地点和事件。",
      goal: "训练看图叙事，逐步建立人物、地点、事件和顺序表达。",
      scoreScale: "ab"
    },
    {
      domain: "preAssessment",
      title: "第2题：时间副词",
      prompt: "孩子能否准确使用表示时间的副词来描述过去、现在、将来三种时态？",
      administration: "在日常生活或图片情境中，引导孩子描述“吃饭前先洗手”“妈妈正在吃饭”“苹果已经吃完了”等。可提示表示过去、现在、将来的词语，如先、已经、刚刚、之前、曾经、原来、正在、一直、将、立刻、马上、就要、一会儿。",
      criteria: "能够准确使用表示过去、现在和将来的6种及以上时间副词。",
      goal: "训练时间词理解与表达，提升事件顺序和时态表达。",
      scoreScale: "ab"
    },
    {
      domain: "preAssessment",
      title: "第3题：复句关系",
      prompt: "孩子能否准确使用表示并列、递进、承接、转折、因果、条件等关系的复句？",
      administration: "在生活情境、图片描述或对话中观察孩子能否用由两个或两个以上意义相关、结构上互不作句子成分的分句组成的复句。重点观察并列、递进、承接、转折、因果、条件等关系。",
      criteria: "能够在自然表达中准确使用多种复句关系，句义清楚、关系恰当。",
      goal: "训练复句理解与表达，提升逻辑语言和叙事组织。",
      scoreScale: "ab"
    },
    {
      domain: "cognitive",
      title: "问题解决与概念理解记录",
      prompt: "观察儿童对配对、分类、因果和任务规则的理解。",
      administration: "使用实物、图片或桌面任务，呈现一至两步规则，记录孩子是否能理解任务要求并完成。",
      criteria: "能够在少量提示下理解规则并稳定完成同类任务。",
      goal: "建立可重复的桌面任务流程，提升学习准备与持续注意。",
      scoreScale: "pep"
    },
    {
      domain: "cognitive",
      title: "学习准备与任务坚持记录",
      prompt: "记录坐姿、等待、转换、完成任务与接受辅助的情况。",
      administration: "安排短任务链，观察孩子开始、等待、完成、转换和接受提示的表现。",
      criteria: "能够在结构化情境中完成短任务链，并接受成人提示。",
      goal: "以短任务链训练等待、轮替和完成意识。",
      scoreScale: "pep"
    },
    {
      domain: "expressive",
      title: "自发表达与功能性沟通记录",
      prompt: "记录主动请求、拒绝、命名、评论和求助的表达方式。",
      administration: "设置有动机的游戏或生活情境，观察孩子是否主动使用口语、手势、图片或其他方式表达需求。",
      criteria: "能够在多个情境中主动发起至少两类功能性沟通。",
      goal: "优先建立可泛化的请求、回应和选择表达。",
      scoreScale: "pep"
    },
    {
      domain: "expressive",
      title: "词句表达与语用表达记录",
      prompt: "记录词汇量、句长、仿说、自发句和情境表达质量。",
      administration: "通过命名、选择、游戏描述和轮替对话观察孩子的词句表达。",
      criteria: "能够根据情境自发使用清楚、合适的词句表达。",
      goal: "从高频生活场景建立短句表达与轮替对话。",
      scoreScale: "pep"
    },
    {
      domain: "receptive",
      title: "词汇与指令理解记录",
      prompt: "记录对常见物品、动作、方位和一至二步指令的理解。",
      administration: "使用实物、图片和动作指令，观察孩子在不同提示等级下的理解表现。",
      criteria: "能够理解常见词汇和一至二步日常指令。",
      goal: "采用实物、图片和动作线索逐步淡化提示。",
      scoreScale: "pep"
    },
    {
      domain: "receptive",
      title: "听觉注意与情境理解记录",
      prompt: "记录听名反应、共同注意、活动规则和语言环境适应。",
      administration: "在自由游戏和结构化任务中观察听名、转头、看向目标和按规则参与。",
      criteria: "能够在自然情境中对语言信息作出稳定回应。",
      goal: "在游戏和课堂例行中提升听觉关注和回应速度。",
      scoreScale: "pep"
    },
    {
      domain: "fineMotor",
      title: "双手协调与操作记录",
      prompt: "记录抓握、穿插、拼插、剪贴、翻页和工具操作。",
      administration: "提供拼插、串珠、纸笔或剪贴材料，观察手部稳定、双手分工和操作计划。",
      criteria: "能够按年龄和任务要求完成基础手部操作。",
      goal: "安排精细动作分级练习，改善手部稳定与操作计划。",
      scoreScale: "pep"
    },
    {
      domain: "grossMotor",
      title: "姿势控制与动作计划记录",
      prompt: "记录平衡、跳跃、跨越、上下楼和身体协调。",
      administration: "设置安全运动路线，观察姿势控制、动作计划、协调和模仿。",
      criteria: "能够完成基础大动作任务并保持安全参与。",
      goal: "结合感统与动作游戏提升核心稳定和动作组织。",
      scoreScale: "pep"
    },
    {
      domain: "visualMotor",
      title: "视觉动作模仿记录",
      prompt: "记录动作模仿、积木仿搭、图形临摹和眼手协调。",
      administration: "示范动作、积木结构或简单图形，观察孩子是否能看后模仿。",
      criteria: "能够在示范后完成基础视觉动作模仿任务。",
      goal: "使用看一看、做一做、再变化的模仿链训练。",
      scoreScale: "pep"
    },
    {
      domain: "affective",
      title: "情绪表达与调节记录",
      prompt: "记录开心、拒绝、挫败、寻求安抚和情绪恢复过程。",
      administration: "在游戏、等待、转换和失败情境中观察情绪表达与恢复。",
      criteria: "能够表达基本情绪，并在成人支持下恢复参与。",
      goal: "建立情绪命名、替代表达和共同调节策略。",
      scoreScale: "pep"
    },
    {
      domain: "social",
      title: "社交互惠与共同注意记录",
      prompt: "记录眼神、回应、轮替、分享兴趣和成人/同伴互动。",
      administration: "通过轮替游戏、共同阅读和分享物品观察互动质量。",
      criteria: "能够回应成人互动，并出现共同注意或轮替行为。",
      goal: "通过结构化游戏提升轮替、回应和共同关注。",
      scoreScale: "pep"
    },
    {
      domain: "motorBehavior",
      title: "动作行为与感官反应记录",
      prompt: "记录刻板动作、感官寻求/回避、转换困难和自我刺激。",
      administration: "在自由活动和任务转换中观察动作行为、感官反应和调节需要。",
      criteria: "行为不明显影响安全、参与和学习，或可在支持下恢复。",
      goal: "识别触发因素，建立替代活动和环境支持。",
      scoreScale: "pep"
    },
    {
      domain: "verbalBehavior",
      title: "语言行为特征记录",
      prompt: "记录仿说、重复发声、非功能性语言和沟通意图。",
      administration: "在对话、请求和游戏情境中观察语言是否具备明确沟通功能。",
      criteria: "能够将语言用于请求、回应、评论或表达情绪等功能。",
      goal: "将重复语言转化为功能性表达与情境回应。",
      scoreScale: "pep"
    },
    {
      domain: "selfCare",
      title: "生活自理能力记录",
      prompt: "记录进食、穿脱、如厕、睡眠、清洁和安全意识。",
      administration: "通过家长访谈和必要的自然情境观察记录生活技能水平。",
      criteria: "能够完成与年龄相符的部分生活自理步骤，或在提示下完成。",
      goal: "拆分生活技能步骤，建立家庭练习表。",
      scoreScale: "pep"
    },
    {
      domain: "adaptive",
      title: "家庭与学校适应记录",
      prompt: "记录例行参与、等待、转换、规则理解和环境变化反应。",
      administration: "结合家长/教师访谈和课堂或家庭情境观察，记录适应表现。",
      criteria: "能够参与基础例行活动，并在支持下适应规则和转换。",
      goal: "制定家庭/课堂一致的视觉提示和行为支持。",
      scoreScale: "pep"
    }
  ];

  const expandedBankItems = [
    ["preAssessment", "第4题：听名与共同注意", "孩子听到自己的名字后，能否转头、看向成人或用声音/动作回应？", "在自由游戏和桌面任务中从不同距离呼名2到3次，记录是否需要视觉或触觉提示。", "多数机会能在3秒内回应，并能短暂看向成人或目标物。", "提升听名反应和共同注意，为后续语言指令建立基础。", "ab", "玩具或孩子感兴趣物"],
    ["preAssessment", "第5题：一至二步指令", "孩子能否理解并完成一至二步日常指令？", "给出生活化指令，如拿杯子、把积木放盒子里、拿书给老师，记录提示等级。", "能在少量提示下完成一至二步熟悉指令。", "训练听觉理解、动作执行和任务完成意识。", "ab", "日常物品"],
    ["preAssessment", "第6题：常见物品命名", "孩子能否说出或用替代沟通方式表达常见物品名称？", "呈现5到10个高频实物或图片，观察命名、指认或替代沟通表现。", "能稳定表达或指认多数高频物品。", "扩展核心名词词汇，建立请求和命名基础。", "ab", "物品图片卡/实物"],
    ["preAssessment", "第7题：动作词理解与表达", "孩子能否理解或表达吃、喝、跑、睡、洗等常见动作？", "使用动作图片、玩具演示或成人示范，请孩子指认、模仿或说出动作。", "能理解或表达多数常见动作词。", "建立动词词汇，提升短句表达和指令理解。", "ab", "动作图片卡"],
    ["preAssessment", "第8题：属性词理解", "孩子能否理解颜色、大小、形状、数量等基础属性？", "用两到三组选项进行选择任务，如大的车、红色积木、两个杯子。", "能在多个属性中完成稳定选择。", "训练属性词理解和分类描述能力。", "ab", "积木/图片卡"],
    ["preAssessment", "第9题：方位与空间关系", "孩子能否理解上面、下面、里面、旁边、前后等方位词？", "用玩具和容器演示，请孩子按指令摆放或说出位置。", "能理解至少3类基础方位关系。", "提升空间语言理解和执行指令能力。", "ab", "玩具、盒子"],
    ["preAssessment", "第10题：请求与拒绝", "孩子能否用合适方式表达想要、不要、停下、还要或帮忙？", "设置有动机但需要协助的情境，观察孩子是否主动请求或拒绝。", "能以口语、手势、图片或其他方式表达至少两类功能。", "建立功能性沟通，减少因表达受限导致的情绪行为。", "ab", "喜欢的玩具/零食"],
    ["preAssessment", "第11题：动作模仿", "孩子能否模仿成人的简单身体动作和物品动作？", "示范拍手、敲桌、推车、喂娃娃等动作，观察孩子是否跟随。", "能模仿多数简单动作，或在提示后完成。", "通过模仿建立学习通道和互动轮替。", "ab", "玩具车、娃娃、积木"],
    ["preAssessment", "第12题：轮替游戏", "孩子能否参与你来我往的简单轮替活动？", "进行滚球、叠积木、轮流放拼图等活动，记录等待和轮替表现。", "能在成人提示下完成至少3轮轮替。", "训练等待、轮替、互动回应和规则参与。", "ab", "球、积木、拼图"],
    ["preAssessment", "第13题：假想游戏", "孩子能否用物品进行简单象征性游戏？", "提供娃娃、杯子、电话、车等材料，观察喂娃娃、打电话、开车等游戏。", "能出现自发或提示后的功能性/假想性玩法。", "提升象征性游戏和语言场景表达。", "ab", "娃娃、餐具、电话玩具"],
    ["preAssessment", "第14题：回答问题", "孩子能否回答是什么、在哪里、谁、做什么等基础问题？", "结合实物、图片和日常对话提出问题，允许使用口语或替代沟通。", "能回答至少两类基础问题。", "训练问答理解、语义提取和社交回应。", "ab", "图片卡"],
    ["preAssessment", "第15题：事件排序", "孩子能否按先后顺序排列或描述简单事件？", "使用洗手、吃饭、睡觉等三步图片，请孩子排序或讲述。", "能在提示下完成三步顺序，或用语言描述先后。", "提升时间顺序、因果理解和叙事组织。", "ab", "生活序列图片"],
    ["preAssessment", "第16题：等待与转换", "孩子能否在活动转换和短时间等待中保持参与？", "从喜欢活动转到桌面任务，或让孩子等待10到30秒，记录反应和支持。", "能在成人支持下完成等待或转换，不明显影响评估进行。", "建立等待、转换和情绪调节基础。", "ab", "计时器/视觉提示"],
    ["preAssessment", "第17题：陌生任务适应", "孩子遇到不熟悉材料或任务时，能否尝试参与？", "呈现一项新任务，观察接近、探索、拒绝、求助和接受示范的表现。", "能在示范或提示后尝试参与。", "提升新任务适应和学习灵活性。", "ab", "新玩具/桌面材料"],
    ["preAssessment", "第18题：情绪表达", "孩子能否用表情、动作、语言或图片表达基本情绪？", "通过图片、故事或实际互动观察开心、生气、害怕、难过等表达。", "能识别或表达至少两种基本情绪。", "建立情绪识别和替代表达能力。", "ab", "情绪图片"],
    ["preAssessment", "第19题：简单规则理解", "孩子能否理解先后、轮流、收好、不能拿等基础规则？", "在游戏和桌面任务中设置简单规则，观察执行和纠错能力。", "能在成人提示下遵守基础规则。", "提升课堂参与、游戏规则和行为边界理解。", "ab", "结构化游戏材料"],
    ["preAssessment", "第20题：家长主诉核对", "家长描述的主要困难是否能在现场观察中获得初步线索？", "结合家长访谈内容，在评估中观察语言、社交、行为或自理方面的对应表现。", "能形成清晰的后续评估假设和重点领域。", "将家长主诉转化为具体评估路径和训练目标。", "ab", "家长访谈记录表"],
    ["receptive", "理解语言1：常见名词指认", "孩子能否在实物或图片中指认常见人物、动物、食物、玩具和生活用品？", "每次呈现2到4个选项，请孩子找出目标，记录错误类型和提示等级。", "能在不同类别中稳定指认多数目标词。", "扩展名词理解，支持听指令和回答问题。", "pep", "实物/图片卡"],
    ["receptive", "理解语言2：动作指认", "孩子能否理解跑、跳、睡、洗、推、拉、打开等动作词？", "呈现动作图片或现场动作，请孩子指出或执行目标动作。", "能理解常见动作词，并可泛化到不同材料。", "提升动词理解和句子理解基础。", "pep", "动作图片/玩具"],
    ["receptive", "理解语言3：人物与代词", "孩子能否理解我、你、他、妈妈、老师、小朋友等人物指代？", "在游戏和图片情境中提出找谁、给谁、谁在做等要求。", "能在情境中理解基本人物和代词指代。", "训练人物关系、代词理解和对话理解。", "pep", "人物图片/娃娃"],
    ["receptive", "理解语言4：否定句理解", "孩子能否理解不是、不要、没有、不能等否定信息？", "设置两个或多个选项，如拿不是红色的、不要车、找没有帽子的图片。", "能在少量提示下理解基础否定要求。", "提升复杂指令和规则语言理解。", "pep", "图片卡/实物"],
    ["receptive", "理解语言5：二步相关指令", "孩子能否完成两个相关动作的连续指令？", "给出如拿杯子放桌上、把车给妈妈再回来等指令。", "能在熟悉材料中完成二步相关指令。", "训练听觉记忆和连续动作执行。", "pep", "日常物品"],
    ["receptive", "理解语言6：二步不相关指令", "孩子能否完成两个不相关动作的连续指令？", "给出如拍手后拿车、摸头再把书给老师等指令。", "能在少量提示下完成二步不相关指令。", "pep", "玩具/桌面材料"],
    ["receptive", "理解语言7：类别理解", "孩子能否按动物、食物、交通工具、衣物等类别理解词汇？", "要求孩子找出同一类物品或从多个选项中找类别目标。", "能理解至少3类常见类别。", "建立分类概念和语义网络。", "pep", "分类图片卡"],
    ["receptive", "理解语言8：功能理解", "孩子能否理解物品用途，如用来喝水、剪纸、睡觉、写字？", "提出用途问题，请孩子指认对应物品或做出动作。", "能根据功能选择多数常见物品。", "提升功能概念和日常问题理解。", "pep", "生活用品图片"],
    ["receptive", "理解语言9：为什么/怎么办理解", "孩子能否理解简单原因和解决办法问题？", "结合图片或故事问为什么哭、杯子倒了怎么办等。", "能在熟悉情境中理解原因或解决办法。", "训练因果理解和问题解决语言。", "pep", "情境图片"],
    ["receptive", "理解语言10：故事理解", "孩子听短故事后，能否回答人物、地点、事件和结果？", "讲一个3到5句短故事，提出基础理解问题。", "能回答至少一半的故事理解问题。", "提升听理解、记忆和叙事理解。", "pep", "短故事图片"],
    ["expressive", "表达语言1：主动发起请求", "孩子能否主动向成人提出想要、还要、打开、帮忙等请求？", "设置需要帮助或有动机的情境，等待孩子发起表达。", "能在等待后主动发起至少一种清楚请求。", "建立主动沟通和功能性表达。", "pep", "动机物/容器"],
    ["expressive", "表达语言2：拒绝与选择表达", "孩子能否表达不要、不喜欢、换一个或二选一选择？", "提供喜欢和不喜欢的物品，观察拒绝、选择和坚持表达方式。", "能使用口语、手势或图片表达拒绝和选择。", "减少哭闹抢夺，用沟通替代问题行为。", "pep", "两类玩具/图片"],
    ["expressive", "表达语言3：动作描述", "孩子能否用动词描述图片或现场动作？", "呈现动作图片或让玩偶执行动作，请孩子说出或表达正在做什么。", "能表达多个常见动作词。", "扩展动词表达，支持短句生成。", "pep", "动作卡/玩偶"],
    ["expressive", "表达语言4：二词组合", "孩子能否使用名词+动词、形容词+名词或人物+动作的二词组合？", "在游戏和图片描述中诱发二词组合，记录自发和仿说差异。", "能自发或少提示下使用多种二词组合。", "从单词表达过渡到短语表达。", "pep", "图片卡/玩具"],
    ["expressive", "表达语言5：三词以上句子", "孩子能否使用三词及以上句子表达需求或描述事件？", "通过讲图、请求和对话观察句长、语序和清晰度。", "能在熟悉情境中产生三词以上表达。", "提升句子长度和语法组织。", "pep", "情境图"],
    ["expressive", "表达语言6：回答WH问题", "孩子能否回答谁、什么、哪里、做什么、为什么等问题？", "结合实物、图片和生活事件提问，记录哪类问题最困难。", "能稳定回答至少3类基础WH问题。", "建立问答对话和课堂回应能力。", "pep", "情境图片"],
    ["expressive", "表达语言7：主动评论", "孩子是否会主动分享看到的、喜欢的或发生的事情？", "观察自由游戏、绘本和突发事件中是否出现评论表达。", "能出现不以索取为目的的评论或分享。", "提升社交性语言和共同注意表达。", "pep", "绘本/玩具"],
    ["expressive", "表达语言8：对话轮替", "孩子能否在成人对话中维持2到3轮轮替？", "围绕喜欢主题进行简短对话，记录是否回应、补充或提问。", "能在支持下完成至少2轮相关对话。", "训练对话维持、回应和主题相关性。", "pep", "话题图片"],
    ["expressive", "表达语言9：复述短句", "孩子能否复述短句或关键句，保持主要词语和顺序？", "成人说2到6词短句，请孩子复述，记录遗漏和替换。", "能复述符合其发展水平的短句。", "提升听觉记忆、语音工作记忆和句子表达。", "pep", "句子卡"],
    ["expressive", "表达语言10：清晰度与可懂度", "陌生听者能否理解孩子大部分表达？", "记录自发语言、仿说和命名中的发音清晰度、音节结构和语速。", "熟悉话题下多数表达可被成人理解。", "为构音/语音训练和沟通效率提供依据。", "pep", "录音记录表"],
    ["cognitive", "认知学习1：相同配对", "孩子能否将完全相同的物品或图片进行配对？", "呈现2到4组选项，请孩子把一样的放一起。", "能稳定完成多个相同配对任务。", "建立视觉辨别和基础学习反应。", "pep", "配对图片/实物"],
    ["cognitive", "认知学习2：非相同配对", "孩子能否将同类但外观不同的物品或图片配对？", "如不同颜色的杯子、不同样式的狗，请孩子找同类。", "能理解同类概念并完成非相同配对。", "提升概念泛化和分类基础。", "pep", "分类图片"],
    ["cognitive", "认知学习3：按一个属性分类", "孩子能否按颜色、形状、大小或类别进行分类？", "提供混合材料，要求按一个明确属性分组。", "能按至少一种属性完成分类。", "训练概念组织和桌面学习能力。", "pep", "积木/图形卡"],
    ["cognitive", "认知学习4：简单问题解决", "孩子遇到打不开、够不到、缺少材料时能否尝试解决？", "设置轻微障碍，观察尝试、求助、替代策略和坚持。", "能尝试解决或主动寻求帮助。", "提升问题解决和求助沟通。", "pep", "透明盒/高处物品"],
    ["cognitive", "认知学习5：数量概念", "孩子能否理解一个、两个、多/少、一样多等基础数量？", "用实物进行拿一个、给两个、哪边多等任务。", "能完成符合年龄的基础数量判断。", "建立数学前概念和指令理解。", "pep", "小物件/计数卡"],
    ["cognitive", "认知学习6：颜色形状命名或指认", "孩子能否识别或表达基础颜色和形状？", "呈现常见颜色和圆形、方形、三角形等图形。", "能识别或表达多个基础颜色/形状。", "提升属性概念和描述语言。", "pep", "颜色形状卡"],
    ["cognitive", "认知学习7：记忆与寻找", "孩子能否记住刚隐藏的物品位置并寻找？", "在孩子面前将物品藏在两个到三个位置之一，短暂延迟后让其寻找。", "能在短延迟后找回目标物。", "训练工作记忆和目标保持。", "pep", "杯子/小玩具"],
    ["cognitive", "认知学习8：规则变化", "孩子能否在规则改变后调整反应？", "先按颜色分，再改按形状分，观察是否固着原规则。", "能在提示下转换分类规则。", "提升认知灵活性和转换能力。", "pep", "多属性卡片"],
    ["social", "社交互惠1：眼神调节", "孩子在请求、回应或分享时是否会使用眼神协调？", "观察自由游戏、请求帮助和共同阅读中的眼神使用。", "能在部分互动中看向成人或目标物进行协调。", "提升眼神协调和沟通质量。", "pep", "互动玩具"],
    ["social", "社交互惠2：共享兴趣", "孩子是否会把感兴趣的物品或事件展示给成人？", "提供新奇玩具或有趣事件，观察是否展示、指给成人看或评论。", "能出现分享兴趣行为，不只是索取。", "训练共同注意和社交分享。", "pep", "新奇玩具"],
    ["social", "社交互惠3：回应共同注意", "成人指向远处物品时，孩子能否跟随看向目标？", "成人说看那里并指向目标，记录是否看向目标和回看成人。", "能跟随成人指向或视线寻找目标。", "提升回应共同注意和课堂跟随能力。", "pep", "墙面图片/玩具"],
    ["social", "社交互惠4：发起共同注意", "孩子是否会主动指、看、说来吸引成人关注某物？", "在自由游戏中观察孩子是否主动发起共享注意。", "能出现至少一种主动共享行为。", "提升社交主动性和非请求性沟通。", "pep", "有趣材料"],
    ["social", "社交互惠5：同伴接近", "孩子是否愿意接近同伴或容忍同伴在附近活动？", "通过小组或模拟同伴情境观察接近、回避、抢夺和并行游戏。", "能在支持下与同伴近距离并行或短暂互动。", "建立同伴游戏和融合参与基础。", "pep", "小组游戏材料"],
    ["social", "社交互惠6：轮流与等待", "孩子能否在社交游戏中等待并轮流？", "使用滚球、抽卡、桌游轮流，记录提示等级和情绪反应。", "能在成人支持下完成多轮轮替。", "提升社交规则和等待能力。", "pep", "轮替游戏材料"],
    ["social", "社交互惠7：模仿同伴", "孩子能否模仿同伴动作、玩法或简单语言？", "安排同伴示范简单动作或游戏，观察孩子是否跟随。", "能在提示下模仿同伴行为。", "促进同伴学习和课堂参与。", "pep", "同伴活动"],
    ["social", "社交互惠8：社交修复", "沟通失败时，孩子能否重复、换方式或寻求帮助？", "故意误解孩子请求或制造轻微沟通障碍，观察修复方式。", "能使用重复、指示、拉成人或换词等修复策略。", "提升沟通坚持和清晰表达。", "pep", "动机物"],
    ["social", "社交互惠9：情绪回应", "孩子能否注意到他人开心、难过、生气并作出回应？", "使用图片、故事或成人表演，观察识别和回应。", "能识别部分他人情绪并有相应反应。", "训练情绪理解和社会认知。", "pep", "情绪卡/故事图"],
    ["social", "社交互惠10：合作游戏", "孩子能否与成人或同伴共同完成一个目标？", "安排一起搭桥、拼图、找宝物等合作任务，观察分工和回应。", "能在支持下参与共同目标活动。", "提升合作、协商和共同目标意识。", "pep", "合作游戏材料"],
    ["visualMotor", "视觉动作1：积木仿搭", "孩子能否看示范后仿搭2到6块积木结构？", "成人搭出塔、桥、火车等结构，请孩子照样搭。", "能完成符合年龄的基础仿搭结构。", "训练视觉分析、模仿和建构能力。", "pep", "积木"],
    ["visualMotor", "视觉动作2：图形临摹", "孩子能否临摹竖线、横线、圆、十字、方形等图形？", "呈现图形样本，让孩子照样画，记录握笔和空间组织。", "能完成符合年龄的基础图形临摹。", "提升书写前视觉动作整合。", "pep", "纸笔"],
    ["visualMotor", "视觉动作3：拼图完成", "孩子能否根据形状或图案完成拼图？", "提供2到12片拼图，记录扫描、试错和完成情况。", "能完成符合发展水平的拼图任务。", "训练视觉辨别和问题解决。", "pep", "拼图"],
    ["visualMotor", "视觉动作4：图案延续", "孩子能否延续简单颜色或形状规律？", "摆出红蓝红蓝或大大小小等规律，请孩子继续。", "能在提示下完成简单规律延续。", "提升视觉规律、排序和数学前技能。", "pep", "串珠/图形卡"],
    ["visualMotor", "视觉动作5：视觉搜索", "孩子能否从复杂图中找出指定目标？", "给出含多个干扰项的图片，让孩子寻找目标物。", "能在合理时间内找到多数目标。", "训练视觉注意和课堂材料搜索。", "pep", "视觉搜索图"],
    ["visualMotor", "视觉动作6：按样复制排列", "孩子能否根据样板复制物品排列顺序？", "呈现3到5个物品排列，让孩子照样摆放。", "能复制基础排列和方向。", "训练空间关系和工作记忆。", "pep", "小物件/样板卡"],
    ["fineMotor", "精细动作1：拇食指捏取", "孩子能否用拇指和食指捏取小物件？", "提供小积木、豆袋或贴纸，观察抓握方式和准确性。", "能使用较成熟的捏取方式完成任务。", "提升手指分化和操作精确度。", "pep", "小物件"],
    ["fineMotor", "精细动作2：双手分工", "孩子能否一手固定一手操作？", "安排开盒、拧盖、穿线、撕纸等任务，观察双手协调。", "能在提示下完成基础双手分工。", "提升双侧协调和生活技能基础。", "pep", "盒子/瓶盖/线绳"],
    ["fineMotor", "精细动作3：工具使用", "孩子能否使用勺子、蜡笔、夹子、剪刀等基础工具？", "提供安全工具并示范，记录握法、力量和控制。", "能安全使用至少一种工具完成目标。", "提升手部控制和工具操作。", "pep", "勺子/蜡笔/夹子"],
    ["fineMotor", "精细动作4：剪贴前技能", "孩子能否撕纸、贴贴纸、沿线剪或打开胶棒？", "根据年龄选择剪贴任务，记录辅助程度。", "能完成符合发展水平的剪贴前任务。", "为手工和书写前课堂活动做准备。", "pep", "纸、贴纸、安全剪刀"],
    ["fineMotor", "精细动作5：穿插与串珠", "孩子能否把珠子穿在线上或把形状插入孔位？", "提供大珠、小珠或插板，观察眼手协调和坚持。", "能完成多个连续穿插动作。", "训练眼手协调和持续操作。", "pep", "串珠/插板"],
    ["fineMotor", "精细动作6：扣件操作", "孩子能否操作拉链、纽扣、魔术贴或按扣？", "使用衣物或练习板，观察打开和闭合能力。", "能在提示下完成一种以上扣件操作。", "提升穿脱衣和生活自理能力。", "pep", "扣件练习板"],
    ["grossMotor", "粗大动作1：单脚平衡", "孩子能否单脚站立或在窄面保持平衡？", "在安全环境中示范单脚站或走平衡线，记录时间和稳定性。", "能完成符合年龄的基础平衡任务。", "提升姿势控制和身体稳定。", "pep", "平衡线/垫子"],
    ["grossMotor", "粗大动作2：双脚跳跃", "孩子能否双脚同时起跳和落地？", "示范原地跳、向前跳或跳过低障碍，注意安全。", "能完成基础双脚跳跃任务。", "提升下肢力量、协调和动作计划。", "pep", "软垫/标记线"],
    ["grossMotor", "粗大动作3：上下楼或跨越", "孩子能否交替或扶栏上下台阶，或跨越低障碍？", "在安全场地观察上下台阶、跨越软障碍表现。", "能在安全支持下完成基础台阶或跨越任务。", "提升环境移动和身体协调。", "pep", "台阶/软障碍"],
    ["grossMotor", "粗大动作4：球类互动", "孩子能否接、抛、踢或滚动球并参与互动？", "与孩子进行滚球、踢球、抛接球，记录协调和轮替。", "能完成至少一种球类互动动作。", "提升动作协调和社交轮替。", "pep", "球"],
    ["grossMotor", "粗大动作5：动作序列", "孩子能否连续完成2到3个动作组成的路线？", "设置爬、跳、钻、投等路线，观察顺序记忆和运动计划。", "能在提示下完成简单动作路线。", "训练运动计划和执行顺序。", "pep", "感统路线材料"],
    ["grossMotor", "粗大动作6：节奏动作模仿", "孩子能否跟随拍手、跺脚、快慢走等节奏动作？", "示范简单节奏，请孩子跟随，记录节律和同步。", "能模仿基础节奏动作。", "提升动作模仿、节奏和集体活动参与。", "pep", "节奏卡/音乐"],
    ["affective", "情感表达1：情绪识别", "孩子能否识别开心、生气、难过、害怕等基本情绪？", "使用表情图片、故事图或成人表演，请孩子指认或命名。", "能识别至少两种基本情绪。", "建立情绪词汇和社会理解基础。", "pep", "情绪卡"],
    ["affective", "情感表达2：挫败反应", "孩子遇到困难或失败时如何表达和恢复？", "设置适度挑战任务，观察求助、放弃、哭闹、攻击或恢复参与。", "能在成人支持下恢复并继续参与。", "训练挫折耐受和求助表达。", "pep", "挑战任务材料"],
    ["affective", "情感表达3：转换情绪", "从喜欢活动转换到非偏好任务时，孩子能否调节情绪？", "使用视觉提示或倒计时进行转换，记录情绪强度和恢复时间。", "能在支持下完成转换。", "建立可预期的转换流程和自我调节。", "pep", "视觉日程/计时器"],
    ["affective", "情感表达4：寻求安抚", "孩子情绪不稳时是否会寻求成人帮助或接受安抚？", "观察自然情绪波动中孩子是否接近成人、表达需要或接受策略。", "能接受至少一种安抚或调节方式。", "建立安全求助和共同调节。", "pep", "安抚物/视觉卡"],
    ["affective", "情感表达5：积极情感分享", "孩子开心或兴奋时是否会与他人分享？", "制造有趣事件，观察微笑、看人、展示、评论或邀请。", "能出现共享积极情绪行为。", "提升情感互享和社交动机。", "pep", "泡泡/音乐玩具"],
    ["affective", "情感表达6：情绪替代表达", "孩子能否用词语、图片或动作替代哭闹表达需求？", "在轻微不满足情境中提示孩子用替代方式表达。", "能在提示下使用替代表达。", "减少问题行为，提高沟通效率。", "pep", "情绪/需求卡"],
    ["motorBehavior", "动作行为1：刻板动作频率", "孩子是否出现拍手、转圈、摇摆、排列等重复动作？", "在自由活动和任务要求中记录频率、持续时间和影响。", "行为不明显影响安全和参与，或能在支持下转换。", "识别功能并建立替代活动。", "pep", "行为观察表"],
    ["motorBehavior", "动作行为2：感官寻求", "孩子是否频繁寻求旋转、撞击、触摸、视觉刺激或口腔刺激？", "观察不同活动中的感官寻求形式、强度和触发条件。", "能在安全边界内接受替代感官活动。", "制定感官调节和环境支持策略。", "pep", "感官观察表"],
    ["motorBehavior", "动作行为3：感官回避", "孩子是否回避声音、触感、气味、光线、人群或运动？", "通过访谈和温和观察记录回避对象与反应强度。", "能在可控支持下接触部分日常刺激。", "逐步建立耐受和预告策略。", "pep", "家长访谈表"],
    ["motorBehavior", "动作行为4：安全意识", "孩子是否存在冲跑、攀爬、吞食、危险触碰等安全风险？", "结合现场观察和照护者报告记录风险情境。", "能在成人提示下停止或回到安全区域。", "建立安全规则、视觉边界和成人协同。", "pep", "安全记录表"],
    ["motorBehavior", "动作行为5：任务逃避", "孩子面对要求时是否通过离开、哭闹、扔物或趴下逃避？", "记录逃避发生的任务、前事、后果和成人应对。", "能在调整任务和提示后恢复部分参与。", "通过任务分级和沟通替代降低逃避。", "pep", "ABC记录表"],
    ["verbalBehavior", "语言行为1：即时仿说", "孩子是否重复成人刚说的话，且功能不清或影响交流？", "在对话和指令后记录即时仿说频率、语调和功能。", "能将部分仿说转为回应、请求或评论。", "把仿说桥接到功能性语言。", "pep", "语言样本表"],
    ["verbalBehavior", "语言行为2：延迟仿说", "孩子是否使用广告、动画、固定台词等延迟仿说？", "记录出现情境、是否与当前场景相关以及沟通功能。", "能在成人解释或建模后使用更贴近情境的表达。", "提升语境化表达和脚本替换。", "pep", "语言样本表"],
    ["verbalBehavior", "语言行为3：非功能性发声", "孩子是否出现哼声、尖叫、重复音节等非功能性发声？", "记录频率、触发、是否用于自我调节或逃避。", "发声不明显影响学习，或能在支持下转为功能表达。", "建立替代沟通和调节方式。", "pep", "行为观察表"],
    ["verbalBehavior", "语言行为4：主题固着", "孩子是否反复谈论单一主题且难以转换？", "在对话中观察主题维持、转换和回应他人话题能力。", "能在提示下短暂回应他人话题或转换主题。", "训练对话灵活性和他人视角。", "pep", "话题卡"],
    ["verbalBehavior", "语言行为5：语调与音量调节", "孩子能否根据场景调节音量、语速和语调？", "观察安静任务、游戏兴奋和对话中的语音调节。", "能在提示下调整音量或语速。", "提升社交可接受度和表达清晰度。", "pep", "音量视觉尺"],
    ["problemBehavior", "问题行为1：攻击或伤害行为", "家长报告孩子是否出现打人、踢人、咬人、抓人、扔物等攻击或伤害行为？", "通过照护者访谈记录发生频率、诱因、对象、持续时间和成人处理方式。", "能明确行为功能假设、风险等级和需要优先干预的场景。", "建立安全预案、替代表达和一致的成人应对流程。", "pep", "照护者访谈表/ABC记录"],
    ["problemBehavior", "问题行为2：自伤或高风险行为", "孩子是否出现撞头、咬手、抓伤自己、冲跑、攀高等自伤或高风险行为？", "通过访谈和必要观察记录风险情境、频次、强度和安全措施。", "能识别高风险行为和即时安全需求。", "制定安全边界、环境调整和主管复核建议。", "pep", "安全风险记录表"],
    ["problemBehavior", "问题行为3：严重情绪爆发", "孩子是否因拒绝、等待、转换或需求未满足出现长时间哭闹、尖叫或崩溃？", "记录典型前因、持续时间、恢复方式、成人安抚是否有效。", "能形成情绪爆发的触发因素与支持策略。", "建立预告、视觉支持、替代表达和共同调节流程。", "pep", "情绪行为访谈表"],
    ["problemBehavior", "问题行为4：逃避任务", "孩子面对学习、生活自理或社交要求时是否经常逃离、趴下、拒绝或拖延？", "询问最容易逃避的任务、成人要求方式、逃避后的结果。", "能区分能力不足、动机不足、任务过难或提示方式不当。", "进行任务分解、强化安排和逐步参与训练。", "pep", "任务逃避记录"],
    ["problemBehavior", "问题行为5：过度依赖成人", "孩子是否在可独立完成的任务中持续等待成人帮忙或要求成人代做？", "访谈家庭和课堂中的依赖场景，记录提示依赖和成人协助习惯。", "能识别可淡化提示的生活或学习任务。", "建立提示淡化、等待和独立完成强化策略。", "pep", "家长访谈表"],
    ["problemBehavior", "问题行为6：固执与转换困难", "孩子是否对路线、物品、顺序、活动结束或规则变化反应强烈？", "记录固执主题、变化强度、成人提前预告是否有效。", "能明确转换困难的触发场景和可用支持。", "使用视觉日程、先后板和变化预告提高灵活性。", "pep", "转换困难记录表"],
    ["problemBehavior", "问题行为7：感官相关行为影响生活", "孩子的感官寻求或回避是否明显影响吃饭、洗澡、穿衣、理发、出门或课堂？", "照护者描述感官相关日常困难、回避对象和家庭应对。", "能识别主要感官影响领域和生活参与限制。", "制定感觉调节、分级暴露和生活场景支持。", "pep", "感官生活访谈表"],
    ["problemBehavior", "问题行为8：睡眠或作息干扰", "孩子是否存在入睡困难、夜醒、早醒、作息颠倒或睡前高度依赖？", "访谈睡前流程、屏幕使用、夜醒频率、家庭处理方式。", "能形成作息问题的初步支持建议。", "建立睡前流程、环境调整和家长一致执行计划。", "pep", "睡眠访谈表"],
    ["problemBehavior", "问题行为9：进食相关行为", "孩子是否存在严重挑食、拒食、含饭、呕吐反应或餐桌逃避？", "记录食物种类、质地、进食时长、家庭压力和安全风险。", "能识别是否需要进一步转介口腔/吞咽/营养评估。", "建立进食环境、食物分级和正向参与目标。", "pep", "进食访谈表"],
    ["problemBehavior", "问题行为10：家庭管理压力", "问题行为是否显著影响家庭外出、入园、照护者情绪或亲子互动？", "访谈家庭最困扰的三个场景和目前应对方式。", "能将家庭压力转化为优先支持目标。", "制定家庭可执行的短期行为支持计划。", "pep", "家庭压力访谈表"],
    ["selfCare", "自理1：进食工具使用", "孩子能否使用勺子、杯子或筷子完成基本进食？", "结合家长报告和模拟任务记录独立程度、洒漏和挑食。", "能完成符合年龄的部分进食步骤。", "提升独立进食和餐桌参与。", "pep", "餐具/访谈表"],
    ["selfCare", "自理2：穿脱衣步骤", "孩子能否配合或独立完成穿脱鞋袜、裤子、外套等步骤？", "使用练习衣物或家长访谈记录步骤完成情况。", "能完成部分关键步骤或在提示下配合。", "拆分穿脱流程并建立家庭练习。", "pep", "衣物/练习板"],
    ["selfCare", "自理3：如厕流程", "孩子是否具备如厕信号、等待、脱穿、冲水、洗手等流程能力？", "通过家长访谈记录现状和困难步骤，不强行现场测试。", "能完成部分如厕流程或表达需求。", "制定如厕训练和视觉流程。", "pep", "家长访谈表"],
    ["selfCare", "自理4：洗手清洁", "孩子能否按步骤完成洗手、擦手、刷牙或洗脸？", "示范或使用视觉步骤卡，观察模仿和独立完成情况。", "能在提示下完成多个清洁步骤。", "建立生活例行和健康卫生习惯。", "pep", "洗手步骤卡"],
    ["selfCare", "自理5：睡眠与作息", "孩子是否有规律作息、入睡困难、夜醒或过度依赖？", "通过照护者访谈记录作息、睡前流程和影响因素。", "能形成可执行的作息支持假设。", "制定家庭作息和睡前流程建议。", "pep", "家长访谈表"],
    ["selfCare", "自理6：个人物品管理", "孩子能否整理书包、收玩具、找自己的杯子或衣物？", "在自然情境或模拟任务中观察分类、收纳和找物。", "能在提示下管理部分个人物品。", "提升日常独立性和课堂准备。", "pep", "书包/玩具盒"],
    ["adaptive", "适应1：视觉日程使用", "孩子能否理解图片日程、先后板或任务清单？", "呈现2到4步日程，观察是否按图完成和转换。", "能在提示下使用视觉支持完成流程。", "建立可预测性，降低转换困难。", "pep", "视觉日程卡"],
    ["adaptive", "适应2：集体指令参与", "孩子能否在小组或课堂中跟随集体指令？", "模拟集体活动指令，如大家坐好、一起拍手、排队。", "能在成人支持下参与部分集体指令。", "提升融合课堂参与和规则跟随。", "pep", "小组活动材料"],
    ["adaptive", "适应3：等待延迟满足", "孩子能否等待短时间获得想要物或轮到自己？", "使用计时器和等待卡，记录等待时间和情绪反应。", "能在支持下等待符合其发展水平的时间。", "训练等待、延迟满足和自我调节。", "pep", "计时器/等待卡"],
    ["adaptive", "适应4：收纳与结束", "活动结束时孩子能否收纳材料并离开活动？", "在喜欢活动后发出结束和收纳要求，记录合作程度。", "能在提示下完成收纳或离开。", "提升结束规则和转换能力。", "pep", "收纳盒/结束卡"],
    ["adaptive", "适应5：社区安全规则", "孩子是否理解牵手、等红灯、不乱跑、不碰危险物等规则？", "通过家长访谈和图片情境判断安全规则理解。", "能理解或在提示下遵守基础社区安全规则。", "建立外出安全和家庭一致规则。", "pep", "社区情境图"],
    ["adaptive", "适应6：泛化能力", "孩子学会的技能能否在不同人、材料和场景中使用？", "比较同一技能在评估师、家长、不同材料中的表现差异。", "能在至少两个条件下表现同一技能，或明确泛化困难。", "制定跨人员、跨材料、跨场景泛化计划。", "pep", "多场景记录表"]
  ].map(([domain, title, prompt, administration, criteria, goal, scoreScale, material]) => ({
    domain,
    title,
    prompt,
    administration,
    criteria,
    goal,
    scoreScale,
    material
  }));

  starterItems.push(...expandedBankItems);
  let questionBankItems = starterItems;

  const $ = (id) => document.getElementById(id);

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const todayString = () => new Date().toISOString().slice(0, 10);

  const createRecordId = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `QY-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  };

  const normalizeQuestionBank = (items) => (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item.id || "",
      domain: item.domain || "",
      title: item.title || "",
      prompt: item.prompt || "",
      manualRef: item.manualRef || "",
      material: item.material || "",
      administration: item.administration || "",
      criteria: item.criteria || "",
      scoreScale: ["ab", "pep"].includes(item.scoreScale) ? item.scoreScale : "ab",
      observation: item.observation || "",
      goal: item.goal || ""
    }))
    .filter((item) => item.domain && item.title);

  const loadAssessmentQuestionBank = async () => {
    try {
      const res = await fetch(`/api/assessment-questions?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const questions = Array.isArray(payload) ? payload : payload.questions;
      if (Array.isArray(questions)) {
        questionBankItems = normalizeQuestionBank(questions);
      }
    } catch (error) {
      console.warn("Failed to load assessment question bank, using local defaults:", error);
      questionBankItems = starterItems;
    }
  };

  const createStarterItems = () => questionBankItems.map((item, index) => ({
    id: `item-${Date.now()}-${index}`,
    sourceQuestionId: item.id || "",
    domain: item.domain,
    title: item.title,
    prompt: item.prompt || "",
    manualRef: item.manualRef || "",
    material: item.material || "",
    administration: item.administration || "",
    criteria: item.criteria || "",
    scoreScale: item.scoreScale || "ab",
    score: "",
    observation: item.observation || "",
    goal: item.goal || ""
  }));

  const collectFields = () => {
    const result = {};
    fieldIds.forEach((id) => {
      const el = $(id);
      if (el) result[id] = el.value;
    });
    return result;
  };

  const fillFields = (fields) => {
    fieldIds.forEach((id) => {
      const el = $(id);
      if (el && fields[id] !== undefined) el.value = fields[id];
    });
  };

  const calculateAgeMonths = () => {
    const birth = $("birthDate")?.value;
    const date = $("assessmentDate")?.value || todayString();
    const target = $("childAgeMonths");
    if (!birth || !target) return;

    const b = new Date(`${birth}T00:00:00`);
    const a = new Date(`${date}T00:00:00`);
    if (Number.isNaN(b.getTime()) || Number.isNaN(a.getTime()) || a < b) {
      target.value = "";
      return;
    }

    let months = (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
    if (a.getDate() < b.getDate()) months -= 1;
    target.value = `${months}个月`;
  };

  const scoreOptions = (scale) => {
    if (scale === "pep") {
      return [
        { value: "2", label: "2", text: "稳定通过" },
        { value: "1", label: "1", text: "萌芽/提示后" },
        { value: "0", label: "0", text: "未通过" },
        { value: "na", label: "NA", text: "未施测" }
      ];
    }
    return [
      { value: "A", label: "A", text: "满足" },
      { value: "B", label: "B", text: "不满足" },
      { value: "na", label: "NA", text: "未施测" }
    ];
  };

  const scoreToValue = (score) => {
    if (score === "A" || score === "2") return 2;
    if (score === "1") return 1;
    if (score === "B" || score === "0") return 0;
    return null;
  };

  const scoreLabel = (score) => {
    if (score === "A") return "满足";
    if (score === "B") return "不满足";
    if (score === "0") return "未通过/明显支持";
    if (score === "1") return "萌芽/提示后";
    if (score === "2") return "稳定通过";
    if (score === "na") return "未施测";
    return "未评分";
  };

  const calculateScores = () => {
    const packageDomainIds = new Set((assessmentPackages[activePackage] || assessmentPackages.pre).domains);
    const packageItems = assessmentItems.filter((item) => packageDomainIds.has(item.domain));
    const byDomain = domains.filter((domain) => packageDomainIds.has(domain.id)).map((domain) => {
      const items = packageItems.filter((item) => item.domain === domain.id);
      const scored = items.filter((item) => scoreToValue(String(item.score)) !== null);
      const raw = scored.reduce((sum, item) => sum + scoreToValue(String(item.score)), 0);
      const max = scored.length * 2;
      const percent = max ? Math.round((raw / max) * 100) : 0;
      const emerging = scored.filter((item) => String(item.score) === "1").length;
      const passed = scored.filter((item) => ["A", "2"].includes(String(item.score))).length;
      const notPassed = scored.filter((item) => ["B", "0"].includes(String(item.score))).length;
      let level = "未完成";
      let priority = "待补充";
      if (scored.length) {
        if (percent >= 80) level = "优势/稳定";
        else if (percent >= 50) level = "发展中";
        else level = "重点支持";

        if (percent < 50 || notPassed >= 2) priority = "高";
        else if (percent < 80 || emerging >= 1) priority = "中";
        else priority = "低";
      }
      return { ...domain, items, scored, raw, max, percent, emerging, passed, notPassed, level, priority };
    });

    const scoredDomains = byDomain.filter((domain) => domain.scored.length);
    const overall = scoredDomains.length
      ? Math.round(scoredDomains.reduce((sum, domain) => sum + domain.percent, 0) / scoredDomains.length)
      : 0;
    const highPriority = byDomain.filter((domain) => domain.priority === "高");
    const emergingTotal = byDomain.reduce((sum, domain) => sum + domain.emerging, 0);
    const scoredItems = packageItems.filter((item) => scoreToValue(String(item.score)) !== null).length;
    const scoreableItems = packageItems.filter((item) => String(item.score) !== "na").length;
    const completion = scoreableItems ? Math.round((scoredItems / scoreableItems) * 100) : 0;

    return { byDomain, overall, highPriority, emergingTotal, scoredItems, scoreableItems, completion, packageItems };
  };

  const currentPackageDomains = () => {
    const packageConfig = assessmentPackages[activePackage] || assessmentPackages.pre;
    return domains.filter((domain) => packageConfig.domains.includes(domain.id));
  };

  const ensureActiveDomain = () => {
    const packageDomains = currentPackageDomains();
    if (!packageDomains.some((domain) => domain.id === activeDomain)) {
      activeDomain = packageDomains[0]?.id || "preAssessment";
    }
  };

  const getNextDomain = () => {
    const packageDomains = currentPackageDomains();
    const currentIndex = packageDomains.findIndex((domain) => domain.id === activeDomain);
    return currentIndex >= 0 ? packageDomains[currentIndex + 1] : null;
  };

  const renderDomainTabs = () => {
    const tabs = $("domainTabs");
    if (!tabs) return;
    ensureActiveDomain();
    const tabData = currentPackageDomains();
    tabs.innerHTML = tabData.map((domain) => {
      const active = activeDomain === domain.id;
      return `
        <button type="button" data-domain-tab="${escapeHtml(domain.id)}" class="shrink-0 rounded-md border px-3 py-2 text-xs font-bold transition ${active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}">
          ${escapeHtml(domain.code)} · ${escapeHtml(domain.label)}
        </button>
      `;
    }).join("");
  };

  const renderItems = () => {
    const list = $("itemsList");
    if (!list) return;
    ensureActiveDomain();
    const visibleItems = assessmentItems.filter((item) => item.domain === activeDomain);
    const countLabel = $("itemCountLabel");
    const active = domainMap[activeDomain];
    if (countLabel) {
      countLabel.textContent = `${assessmentPackages[activePackage]?.label || "当前评估包"} · ${active?.label || "当前模块"} ${visibleItems.length} 题`;
    }
    if (activeItemIndex >= visibleItems.length) activeItemIndex = Math.max(0, visibleItems.length - 1);
    if (activeItemIndex < 0) activeItemIndex = 0;

    if (!visibleItems.length) {
      list.innerHTML = `
        <div class="p-8 text-center text-sm text-slate-500">
          当前领域暂无项目。点击“新增项目”添加机构项目或授权量表记录项。
        </div>
      `;
      return;
    }

    const currentItem = visibleItems[activeItemIndex];
    const scoredInDomain = visibleItems.filter((item) => scoreToValue(String(item.score)) !== null).length;
    const isLastQuestion = activeItemIndex >= visibleItems.length - 1;
    const isCurrentItemScored = scoreToValue(String(currentItem.score)) !== null || String(currentItem.score) === "na";
    const nextDomain = getNextDomain();
    const itemNav = `
      <div class="flex flex-col gap-3 border-b border-brand-100 bg-brand-50/80 px-4 py-4 text-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-brand-600 shadow-sm">
            <i data-lucide="clipboard-check" class="h-5 w-5"></i>
          </div>
          <div>
            <div class="text-xs font-bold text-brand-700">逐题施测 · ${escapeHtml(active?.code || "")} ${escapeHtml(active?.label || "")}</div>
            <div class="mt-1 text-base font-extrabold text-slate-950">第 ${activeItemIndex + 1} / ${visibleItems.length} 题</div>
            <div class="mt-1 text-xs font-semibold text-slate-500">本模块已评分 ${scoredInDomain} / ${visibleItems.length}</div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-question-prev class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 ${activeItemIndex === 0 ? "pointer-events-none opacity-40" : ""}">
            <i data-lucide="chevron-left" class="h-4 w-4"></i>
            上一题
          </button>
          <button type="button" ${isLastQuestion ? "data-next-domain" : "data-question-next"} class="inline-flex items-center gap-2 rounded-md ${isLastQuestion ? "bg-emerald-500 hover:bg-emerald-600" : "bg-brand-500 hover:bg-brand-600"} px-3 py-2 text-sm font-bold text-white shadow-sm transition ${isLastQuestion && !nextDomain ? "pointer-events-none opacity-40" : ""}">
            ${isLastQuestion ? (nextDomain ? `进入${escapeHtml(nextDomain.label)}` : "本评估包已完成") : "下一题"}
            <i data-lucide="${isLastQuestion ? "arrow-right-circle" : "chevron-right"}" class="h-4 w-4"></i>
          </button>
        </div>
      </div>
      ${isLastQuestion ? `
        <div class="${isCurrentItemScored ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"} border-b px-4 py-3 text-sm font-bold">
          ${isCurrentItemScored
            ? (nextDomain ? `本模块最后一题已评分，可进入下一项评估：${escapeHtml(nextDomain.code)} · ${escapeHtml(nextDomain.label)}。` : "当前评估包已到最后一个模块，可进入自动计分或报告生成。")
            : (nextDomain ? `这是本模块最后一题，评分后可进入下一项评估：${escapeHtml(nextDomain.code)} · ${escapeHtml(nextDomain.label)}。` : "这是当前评估包最后一题，评分后可进入自动计分或报告生成。")
          }
        </div>
      ` : ""}
    `;

    list.innerHTML = itemNav + [currentItem].map((item) => {
      const domain = domainMap[item.domain] || domains[0];
      const scale = item.scoreScale || "ab";
      const expanded = expandedItemIds.has(item.id);
      const isScored = scoreToValue(String(item.score)) !== null || String(item.score) === "na";
      const statusClass = isScored ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500";
      return `
        <article class="bg-white" data-item-id="${escapeHtml(item.id)}">
          <div class="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px_auto] lg:items-center">
            <div class="min-w-0">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">${escapeHtml(domain.code)}</span>
                <span class="rounded-md ${statusClass} px-2 py-1 text-[11px] font-bold">${isScored ? scoreLabel(String(item.score)) : "未评分"}</span>
                <span class="text-xs text-slate-400">第 ${activeItemIndex + 1} / ${visibleItems.length} 题</span>
              </div>
              <input data-item-field="title" value="${escapeHtml(item.title)}" class="w-full border-0 bg-transparent p-0 text-xl font-extrabold text-slate-950 focus:ring-0" placeholder="题目名称" />
              <textarea data-item-field="prompt" rows="3" class="mt-3 w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-7 text-slate-800 focus:border-brand-300 focus:bg-white" placeholder="题干/评估问题">${escapeHtml(item.prompt || "")}</textarea>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-2">
                <select data-item-field="scoreScale" class="w-32 rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 focus:border-brand-400">
                  <option value="ab" ${scale === "ab" ? "selected" : ""}>A/B 满足制</option>
                  <option value="pep" ${scale === "pep" ? "selected" : ""}>0/1/2 表现制</option>
                </select>
                <span class="text-xs font-bold text-slate-400">${escapeHtml(domain.group)}</span>
              </div>
              <div class="grid ${scale === "ab" ? "grid-cols-3" : "grid-cols-4"} gap-2">
                ${scoreOptions(scale).map((option) => `
                  <label class="score-option cursor-pointer">
                    <input class="sr-only" type="radio" name="score-${escapeHtml(item.id)}" value="${escapeHtml(option.value)}" ${String(item.score) === option.value ? "checked" : ""} data-item-field="score" />
                    <span class="flex min-h-14 flex-col items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-bold text-slate-600 transition hover:border-brand-300" title="${escapeHtml(option.text)}">
                      <b class="text-lg leading-none">${escapeHtml(option.label)}</b>
                      <em class="mt-1 text-[10px] not-italic">${escapeHtml(option.text)}</em>
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>

            <div class="flex items-center gap-2 lg:justify-end">
              <button type="button" data-toggle-item="${escapeHtml(item.id)}" class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                <i data-lucide="${expanded ? "chevron-up" : "chevron-down"}" class="h-4 w-4"></i>
                ${expanded ? "收起" : "展开"}
              </button>
              <button type="button" data-remove-item="${escapeHtml(item.id)}" class="inline-flex items-center gap-1 rounded-md px-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50">
                <i data-lucide="trash-2" class="h-4 w-4"></i>
              </button>
            </div>
          </div>

          ${expanded ? `
            <div class="border-t border-slate-100 bg-slate-50 px-4 py-4">
              <div class="grid gap-4 lg:grid-cols-2">
                <label class="block">
                  <span class="text-xs font-bold text-slate-500">操作方法</span>
                  <textarea data-item-field="administration" rows="5" class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 focus:border-brand-400" placeholder="施测步骤、提示方式、可接受辅助">${escapeHtml(item.administration || "")}</textarea>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-slate-500">满足标准</span>
                  <textarea data-item-field="criteria" rows="5" class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 focus:border-brand-400" placeholder="满足标准">${escapeHtml(item.criteria || "")}</textarea>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-slate-500">材料/题号</span>
                  <div class="mt-1 grid gap-2 sm:grid-cols-2">
                    <input data-item-field="manualRef" value="${escapeHtml(item.manualRef)}" class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-400" placeholder="题号/手册编号" />
                    <input data-item-field="material" value="${escapeHtml(item.material || "")}" class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-400" placeholder="材料：绘本、图片卡、玩具等" />
                  </div>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-slate-500">所属领域</span>
                  <select data-item-field="domain" class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-brand-400">
                    ${domains.map((d) => `<option value="${escapeHtml(d.id)}" ${d.id === item.domain ? "selected" : ""}>${escapeHtml(d.code)} · ${escapeHtml(d.label)}</option>`).join("")}
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-slate-500">现场观察记录</span>
                  <textarea data-item-field="observation" rows="4" class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 focus:border-brand-400" placeholder="现场表现、提示等级、错误类型">${escapeHtml(item.observation)}</textarea>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-slate-500">可转化训练目标</span>
                  <textarea data-item-field="goal" rows="4" class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 focus:border-brand-400" placeholder="可转化为训练目标">${escapeHtml(item.goal)}</textarea>
                </label>
              </div>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");
    if (window.lucide) window.lucide.createIcons();
  };

  const renderSummary = () => {
    const scores = calculateScores();
    const statData = [
      ["综合完成率", `${scores.completion}%`, "已评分项目 / 可评分项目"],
      ["综合能力指数", `${scores.overall}%`, "各已评领域平均表现"],
      ["萌芽项目", `${scores.emergingTotal}`, "可优先转化训练目标"],
      ["高优先领域", `${scores.highPriority.length}`, "建议纳入近期方案"]
    ];

    $("summaryStats").innerHTML = statData.map((item) => `
      <div class="border border-slate-200 bg-slate-50 p-4">
        <div class="text-xs font-bold text-slate-500">${escapeHtml(item[0])}</div>
        <div class="mt-2 text-3xl font-extrabold text-slate-950">${escapeHtml(item[1])}</div>
        <div class="mt-1 text-xs text-slate-500">${escapeHtml(item[2])}</div>
      </div>
    `).join("");

    $("scoreTable").innerHTML = scores.byDomain.map((domain) => {
      const priorityClass = domain.priority === "高"
        ? "bg-red-50 text-red-700"
        : domain.priority === "中"
          ? "bg-amber-50 text-amber-700"
          : domain.priority === "低"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500";
      return `
        <div class="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.2fr_.8fr_.8fr_.9fr_1fr] lg:items-center">
          <div>
            <div class="font-extrabold text-slate-900">${escapeHtml(domain.code)} · ${escapeHtml(domain.label)}</div>
            <div class="mt-1 text-xs text-slate-500">${escapeHtml(domain.description)}</div>
          </div>
          <div><span class="lg:hidden text-xs font-bold text-slate-500">原始分：</span>${domain.raw}/${domain.max || 0}</div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900">${domain.percent}%</span>
              <span class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span class="block h-full rounded-full bg-brand-500" style="width:${domain.percent}%"></span>
              </span>
            </div>
          </div>
          <div><span class="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">${escapeHtml(domain.level)}</span></div>
          <div><span class="inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${priorityClass}">${escapeHtml(domain.priority)}</span></div>
        </div>
      `;
    }).join("");

    $("sideProgress").textContent = `${scores.completion}%`;
    $("progressBar").style.width = `${scores.completion}%`;
    $("sideRecordId").textContent = $("recordId").value || "未建立";
    if ($("sidePackage")) $("sidePackage").textContent = assessmentPackages[activePackage]?.label || "当前评估包";
    if ($("sideDomain")) $("sideDomain").textContent = domainMap[activeDomain]?.label || "当前模块";
    if ($("sideChildName")) $("sideChildName").textContent = $("childName").value.trim() || "未填写姓名";
    if ($("sideChildMeta")) {
      const age = $("childAgeMonths").value || "月龄待计算";
      const date = $("assessmentDate").value || "评估日期待填写";
      $("sideChildMeta").textContent = `${age} · ${date}`;
    }
    drawRadar(scores.byDomain);
    renderChartLegend(scores.byDomain);
    return scores;
  };

  const drawRadar = (domainScores) => {
    const canvas = $("radarChart");
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(640, Math.floor(rect.width || 760));
    const height = Math.max(420, Math.floor(rect.height || 480));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = Math.min(width, height) * 0.34;
    const count = domainScores.length;

    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    [0.25, 0.5, 0.75, 1].forEach((ratio) => {
      ctx.beginPath();
      domainScores.forEach((_, index) => {
        const angle = (-Math.PI / 2) + (Math.PI * 2 * index / count);
        const x = cx + Math.cos(angle) * radius * ratio;
        const y = cy + Math.sin(angle) * radius * ratio;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = ratio === 1 ? "#cbd5e1" : "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    domainScores.forEach((domain, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index / count);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();

      const labelX = cx + Math.cos(angle) * (radius + 54);
      const labelY = cy + Math.sin(angle) * (radius + 34);
      ctx.fillStyle = "#334155";
      ctx.fillText(domain.code, labelX, labelY - 8);
      ctx.fillStyle = "#64748b";
      ctx.fillText(`${domain.percent}%`, labelX, labelY + 9);
    });

    ctx.beginPath();
    domainScores.forEach((domain, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index / count);
      const valueRadius = radius * (domain.percent / 100);
      const x = cx + Math.cos(angle) * valueRadius;
      const y = cy + Math.sin(angle) * valueRadius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(249, 115, 22, 0.18)";
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    domainScores.forEach((domain, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index / count);
      const valueRadius = radius * (domain.percent / 100);
      const x = cx + Math.cos(angle) * valueRadius;
      const y = cy + Math.sin(angle) * valueRadius;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = domain.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.fillText("能力发展轮廓", cx, 24);
  };

  const renderChartLegend = (domainScores) => {
    const host = $("chartLegend");
    if (!host) return;
    host.innerHTML = domainScores.map((domain) => `
      <div class="flex items-start gap-3">
        <span class="mt-1 h-3 w-3 shrink-0 rounded-sm" style="background:${domain.color}"></span>
        <div>
          <div class="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <span>${escapeHtml(domain.code)}</span>
            <span>${escapeHtml(domain.label)}</span>
            <span class="text-xs text-slate-500">${domain.percent}%</span>
          </div>
          <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(domain.description)}</p>
        </div>
      </div>
    `).join("");
  };

  const getRadarImageDataUrl = () => {
    const canvas = $("radarChart");
    if (!canvas) return "";
    try {
      drawRadar(calculateScores().byDomain);
      return canvas.toDataURL("image/png");
    } catch (error) {
      return "";
    }
  };

  const pep3CompositeDefinitions = [
    { label: "沟通组合", domains: ["cognitive", "expressive", "receptive"] },
    { label: "动作组合", domains: ["fineMotor", "grossMotor", "visualMotor"] },
    { label: "行为特征组合", domains: ["affective", "social", "motorBehavior", "verbalBehavior"] },
    { label: "照护者报告", domains: ["problemBehavior", "selfCare", "adaptive"] }
  ];

  const calculatePep3Composites = (domainScores) => {
    const byId = Object.fromEntries(domainScores.map((domain) => [domain.id, domain]));
    return pep3CompositeDefinitions.map((composite) => {
      const parts = composite.domains.map((id) => byId[id]).filter((domain) => domain && domain.scored.length);
      const percent = parts.length
        ? Math.round(parts.reduce((sum, domain) => sum + domain.percent, 0) / parts.length)
        : 0;
      return {
        ...composite,
        parts,
        percent,
        level: parts.length
          ? (percent >= 80 ? "优势/稳定" : percent >= 50 ? "发展中" : "重点支持")
          : "未完成"
      };
    });
  };

  const buildReportHtml = () => {
    const fields = collectFields();
    const scores = calculateScores();
    const composites = calculatePep3Composites(scores.byDomain);
    const radarImage = getRadarImageDataUrl();
    const strengths = scores.byDomain
      .filter((domain) => domain.percent >= 80 && domain.scored.length)
      .map((domain) => `${domain.code} ${domain.label}`);
    const needs = scores.byDomain
      .filter((domain) => domain.priority === "高")
      .map((domain) => `${domain.code} ${domain.label}`);
    const reportItems = scores.packageItems || assessmentItems;
    const emergingItems = reportItems
      .filter((item) => String(item.score) === "1")
      .slice(0, 8)
      .map((item) => {
        const domain = domainMap[item.domain];
        return `${domain?.label || "未分类"}：${item.title}`;
      });
    const unmetItems = reportItems
      .filter((item) => ["B", "0"].includes(String(item.score)))
      .slice(0, 8)
      .map((item) => {
        const domain = domainMap[item.domain];
        return `${domain?.label || "未分类"}：${item.title}`;
      });
    const sectionTitle = (number, title, desc = "") => `
      <div class="report-section-heading mb-4 flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
        <div class="flex items-start gap-3">
          <span class="report-section-number flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-extrabold text-white">${escapeHtml(number)}</span>
          <div>
            <h3 class="text-base font-extrabold tracking-tight text-slate-950">${escapeHtml(title)}</h3>
            ${desc ? `<p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(desc)}</p>` : ""}
          </div>
        </div>
      </div>
    `;
    const infoCell = (label, value) => `
      <div class="report-cell rounded-md border border-slate-200 bg-white px-4 py-3">
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</div>
        <div class="mt-1 text-sm font-bold text-slate-900">${escapeHtml(value || "未填写")}</div>
      </div>
    `;
    const scoreSummaryCards = [
      { label: "综合完成率", value: `${scores.completion}%`, note: `${scores.scoredItems}/${scores.scoreableItems || reportItems.length} 个可评分项目已评分` },
      { label: "综合能力指数", value: `${scores.overall}%`, note: "各已评领域平均表现" },
      { label: "萌芽项目", value: `${scores.emergingTotal}`, note: "可优先转化训练目标" },
      { label: "高优先领域", value: `${scores.highPriority.length}`, note: scores.highPriority.length ? scores.highPriority.map((domain) => domain.label).join("、") : "暂无高优先领域" }
    ].map((item, index) => `
      <div class="report-score-card rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="text-xs font-extrabold text-slate-500">${escapeHtml(item.label)}</div>
          <span class="h-2 w-2 rounded-full ${index === 3 && scores.highPriority.length ? "bg-red-500" : "bg-brand-500"}"></span>
        </div>
        <div class="report-score-card-value mt-3 text-3xl font-extrabold tracking-tight text-slate-950">${escapeHtml(item.value)}</div>
        <div class="mt-2 min-h-8 text-xs leading-5 text-slate-500">${escapeHtml(item.note)}</div>
      </div>
    `).join("");
    const domainLegendCards = scores.byDomain.map((domain) => `
      <div class="report-domain-card flex gap-3 rounded-md border border-slate-200 bg-white p-3">
        <span class="mt-1 h-3 w-3 shrink-0 rounded-sm" style="background:${domain.color}"></span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span class="text-sm font-extrabold text-slate-950">${escapeHtml(domain.code)}</span>
            <span class="text-sm font-extrabold text-slate-900">${escapeHtml(domain.label)}</span>
            <span class="text-xs font-extrabold text-slate-500">${domain.percent}%</span>
            <span class="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">${escapeHtml(domain.priority)}</span>
          </div>
          <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(domain.description)}</p>
        </div>
      </div>
    `).join("");

    const scoredDomains = scores.byDomain.filter((domain) => domain.scored.length);
    const developingDomains = scoredDomains
      .filter((domain) => domain.priority === "中")
      .slice(0, 5)
      .map((domain) => `${domain.code} ${domain.label}`);
    const planDomains = scores.byDomain
      .filter((domain) => domain.priority === "高" || domain.priority === "中")
      .slice(0, 4)
      .map((domain) => domain.label);
    const overallLevel = scores.overall >= 80
      ? "整体表现相对稳定，可重点关注技能泛化和自然情境中的持续应用"
      : scores.overall >= 50
        ? "整体处于发展中水平，建议围绕关键领域建立阶段性训练目标"
        : "整体需要较高支持，建议优先处理基础参与、理解表达和适应行为相关目标";
    const autoImpression = scores.scoredItems
      ? [
        `本次${assessmentPackages[activePackage]?.label || "评估"}已完成 ${scores.scoredItems}/${scores.scoreableItems || reportItems.length} 个可评分项目，综合能力指数为 ${scores.overall}%，${overallLevel}。`,
        strengths.length ? `相对优势领域包括：${strengths.join("、")}。` : "本次结果暂未形成稳定优势领域，需结合自然情境观察继续确认。",
        needs.length ? `近期高优先支持领域包括：${needs.join("、")}。` : (developingDomains.length ? `发展中领域包括：${developingDomains.join("、")}。` : "当前已评分领域未提示明显高优先支持项。"),
        unmetItems.length ? `未满足/未通过项目提示近期支持重点：${unmetItems.join("；")}。` : "未满足项目较少，可进一步观察项目泛化表现。",
        emergingItems.length ? `萌芽项目可作为近期训练切入点：${emergingItems.join("；")}。` : "萌芽项目较少，建议在互动情境中继续诱发观察。"
      ].join("\n")
      : [
        "当前尚未完成任何评估项目评分，系统暂不生成综合结论。",
        "请先在“评估项目录入”中完成项目评分，再生成报告；评估师也可结合现场观察、照护者访谈和病史资料手动填写专业结论。"
      ].join("\n");
    const autoPlan = scores.scoredItems
      ? [
        planDomains.length ? `优先围绕 ${planDomains.join("、")} 制定 8-12 周个别化训练目标。` : "可根据家庭主要关注和已评分表现制定 8-12 周个别化训练目标。",
        needs.length ? "高优先领域建议先设置可观察、可记录的小步目标，并明确提示方式、辅助撤除和泛化场景。" : "建议在稳定技能的基础上增加自然情境练习，关注跨人员、跨材料和跨场景泛化。",
        emergingItems.length ? `可优先选择萌芽项目作为近期切入点，例如：${emergingItems.slice(0, 4).join("；")}。` : "如萌芽项目不足，建议补充动态观察或选择家庭最急需改善的功能性目标。",
        "建议每周进行结构化训练并设置家庭泛化任务，8-12 周后复评，比较领域完成率、目标达成和家庭/课堂适应变化。"
      ].join("\n")
      : [
        "当前尚未完成评分，系统暂不生成训练建议。",
        "请完成评估项目评分后再生成建议；若需先行记录，可由评估师手动填写初步训练方向。"
      ].join("\n");
    const shouldAutoFillReportField = (el) => !el.value.trim() || el.dataset.autoGenerated === "true";
    if (shouldAutoFillReportField($("clinicalImpression"))) {
      $("clinicalImpression").value = autoImpression;
      $("clinicalImpression").dataset.autoGenerated = "true";
    }
    if (shouldAutoFillReportField($("interventionPlan"))) {
      $("interventionPlan").value = autoPlan;
      $("interventionPlan").dataset.autoGenerated = "true";
    }

    const scoreRows = scores.byDomain.map((domain) => {
      const priorityClass = domain.priority === "高"
        ? "bg-red-50 text-red-700"
        : domain.priority === "中"
          ? "bg-amber-50 text-amber-700"
          : domain.priority === "低"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500";
      return `
        <tr class="border-b border-slate-100">
          <td class="px-4 py-3 pr-3">
            <div class="flex items-center gap-2">
              <span class="h-3 w-3 shrink-0 rounded-sm" style="background:${domain.color}"></span>
              <span class="font-extrabold text-slate-900">${escapeHtml(domain.code)} · ${escapeHtml(domain.label)}</span>
            </div>
            <div class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(domain.description)}</div>
          </td>
          <td class="px-4 py-3 pr-3 font-bold text-slate-700">${domain.raw}/${domain.max || 0}</td>
          <td class="px-4 py-3 pr-3">
            <div class="flex items-center gap-2">
              <span class="w-10 font-bold text-slate-900">${domain.percent}%</span>
              <span class="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span class="block h-full rounded-full" style="width:${domain.percent}%; background:${domain.color}"></span>
              </span>
            </div>
          </td>
          <td class="px-2 py-3 align-middle"><span class="inline-flex whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold leading-none text-slate-700">${escapeHtml(domain.level)}</span></td>
          <td class="px-2 py-3 align-middle"><span class="inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-bold leading-none ${priorityClass}">${escapeHtml(domain.priority)}</span></td>
        </tr>
      `;
    }).join("");
    const compositeRows = composites.map((composite) => `
      <tr class="border-b border-slate-100">
        <td class="px-4 py-3 pr-3 font-bold text-slate-900">${escapeHtml(composite.label)}</td>
        <td class="px-4 py-3 pr-3 text-slate-600">${escapeHtml(composite.parts.map((part) => part.code).join("、") || "未完成")}</td>
        <td class="px-4 py-3 pr-3 font-bold text-slate-900">${composite.percent}%</td>
        <td class="px-4 py-3 text-slate-700">${escapeHtml(composite.level)}</td>
      </tr>
    `).join("");

    return `
      <div class="report-sheet mx-auto max-w-5xl bg-white text-slate-900">
        <div class="report-header overflow-hidden rounded-md border border-slate-200">
          <div class="report-print-kicker bg-white px-7 py-3 text-center text-xs font-extrabold tracking-wide text-slate-700">
            专业评估系统｜启言儿童健康咨询中心
          </div>
          <div class="h-2 bg-brand-500"></div>
          <div class="report-header-body flex flex-col gap-6 bg-slate-50 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-4">
              <div class="report-logo-box flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-2">
                <img src="/assets/logo.png" alt="启言儿童健康咨询中心 LOGO" class="h-full w-full object-contain" />
              </div>
              <div>
                <div class="text-sm font-extrabold tracking-wide text-brand-700">六枝特区启言儿童健康咨询中心</div>
                <h2 class="report-title mt-2 text-3xl font-extrabold tracking-tight text-slate-950">儿童发展评估报告</h2>
                <p class="mt-2 text-sm text-slate-500">${escapeHtml(assessmentPackages[activePackage]?.label || "儿童发展评估")}</p>
              </div>
            </div>
            <div class="report-meta-card min-w-52 rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <span class="font-bold text-slate-500">档案编号</span>
                <span class="font-extrabold text-slate-900">${escapeHtml(fields.recordId || "未填写")}</span>
              </div>
              <div class="mt-2 flex justify-between gap-4">
                <span class="font-bold text-slate-500">评估日期</span>
                <span class="font-extrabold text-slate-900">${escapeHtml(fields.assessmentDate || "未填写")}</span>
              </div>
            </div>
          </div>
        </div>

        <section class="report-section mt-6">
          ${sectionTitle("01", "基本信息", "儿童档案、监护人与施测人员信息")}
          <div class="report-info-grid grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            ${infoCell("儿童姓名", fields.childName)}
            ${infoCell("性别", fields.childSex)}
            ${infoCell("月龄", fields.childAgeMonths)}
            ${infoCell("监护人", fields.guardianName)}
            ${infoCell("评估师", fields.examiner)}
            ${infoCell("评估地点", fields.site)}
          </div>
          <div class="report-note mt-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6">
            <span class="font-bold text-slate-500">主要关注：</span>${escapeHtml(fields.primaryConcern || "未填写")}
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("02", "评估工具与资料来源", "施测工具、版本、材料来源与流程说明")}
          <div class="report-tool-grid grid gap-3 sm:grid-cols-3">
            ${infoCell("工具/版本", fields.instrumentName)}
            ${infoCell("授权/材料编号", fields.licenseNote)}
            ${infoCell("施测方式", fields.assessmentMode)}
          </div>
          <div class="report-note mt-3 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            说明：本系统记录原始表现和机构流程分；若使用 PEP-3 等版权量表，题目施测、原始分解释、常模分换算和专业结论须以机构持有的正版材料及手册为准。
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("03", "综合计分报告", "汇总完成率、综合能力指数、萌芽项目和干预优先级")}
          <div class="report-summary-grid mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            ${scoreSummaryCards}
          </div>
          <h4 class="mt-5 text-sm font-extrabold text-slate-900">PEP-3 组合摘要</h4>
          <div class="report-table-wrap mt-3 overflow-hidden rounded-md border border-slate-200">
            <table class="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col style="width:40%">
                <col style="width:28%">
                <col style="width:16%">
                <col style="width:16%">
              </colgroup>
              <thead class="bg-slate-50">
                <tr class="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th class="px-4 py-3 pr-3">组合</th>
                  <th class="px-4 py-3 pr-3">包含分测验</th>
                  <th class="px-4 py-3 pr-3">完成率</th>
                  <th class="px-4 py-3">水平</th>
                </tr>
              </thead>
              <tbody>${compositeRows}</tbody>
            </table>
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("04", "领域计分摘要", "各评估领域原始分、完成率、等级与优先级")}
          <div class="report-table-wrap mt-3 overflow-hidden rounded-md border border-slate-200">
            <table class="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col style="width:34%">
                <col style="width:10%">
                <col style="width:20%">
                <col style="width:18%">
                <col style="width:18%">
              </colgroup>
              <thead class="bg-slate-50">
                <tr class="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th class="px-4 py-3 pr-3">领域</th>
                  <th class="px-4 py-3 pr-3">原始分</th>
                  <th class="px-4 py-3 pr-3">完成率</th>
                  <th class="px-2 py-3">等级</th>
                  <th class="px-2 py-3">优先级</th>
                </tr>
              </thead>
              <tbody>${scoreRows}</tbody>
            </table>
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("05", "能力图谱", "将各领域完成率转化为能力发展轮廓")}
          ${radarImage ? `
            <div class="report-chart-box mt-3 rounded-md border border-slate-200 bg-white p-4">
              <img src="${radarImage}" alt="能力发展轮廓图" class="mx-auto max-h-[420px] w-full object-contain" />
            </div>
          ` : `
            <p class="mt-3 text-sm text-slate-500">能力图谱暂未生成。</p>
          `}
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("06", "领域解释", "色彩方块对应能力图谱与领域计分表")}
          <div class="report-domain-grid mt-3 grid gap-3 sm:grid-cols-2">
            ${domainLegendCards}
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("07", "观察与访谈摘要", "现场观察、照护者报告与家庭情境信息")}
          <div class="report-two-col-grid grid gap-3 lg:grid-cols-2">
            <div class="report-text-box rounded-md border border-slate-200 bg-white p-4">
              <div class="text-xs font-extrabold text-slate-500">现场观察摘要</div>
              <p class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">${escapeHtml(fields.observationSummary || "未填写")}</p>
            </div>
            <div class="report-text-box rounded-md border border-slate-200 bg-white p-4">
              <div class="text-xs font-extrabold text-slate-500">照护者报告摘要</div>
              <p class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">${escapeHtml(fields.caregiverSummary || "未填写")}</p>
            </div>
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("08", "关键项目记录", "未满足项目与萌芽项目用于近期目标选择")}
          <div class="report-two-col-grid grid gap-3 lg:grid-cols-2">
            <div class="report-key-box rounded-md border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-900">
              <div class="text-xs font-extrabold text-red-700">未满足/未通过项目</div>
              <p class="mt-2">${escapeHtml(unmetItems.length ? unmetItems.join("；") : "暂无")}</p>
            </div>
            <div class="report-key-box rounded-md border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div class="text-xs font-extrabold text-amber-700">萌芽项目</div>
              <p class="mt-2">${escapeHtml(emergingItems.length ? emergingItems.join("；") : "暂无")}</p>
            </div>
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("09", "综合结论", "结合量表、观察、访谈与病史形成专业判断")}
          <div class="report-text-box rounded-md border border-slate-200 bg-white p-4">
            <p class="whitespace-pre-line text-sm leading-7 text-slate-700">${escapeHtml($("clinicalImpression").value || "未填写")}</p>
          </div>
        </section>

        <section class="report-section mt-6">
          ${sectionTitle("10", "个别化训练建议", "训练频次、阶段目标、家庭配合与复评安排")}
          <div class="report-text-box rounded-md border border-slate-200 bg-white p-4">
            <p class="whitespace-pre-line text-sm leading-7 text-slate-700">${escapeHtml($("interventionPlan").value || "未填写")}</p>
          </div>
        </section>

        <section class="report-disclaimer mt-8 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs leading-5 text-slate-500">本报告用于康复训练与教育支持计划制定，不单独作为医学诊断证明。诊断与用药等医学决策请由具备资质的医疗机构完成。</p>
        </section>
      </div>
    `;
  };

  const renderReport = () => {
    const html = buildReportHtml();
    $("reportPreview").innerHTML = html;
    $("printReport").innerHTML = html;
  };

  const collectPayload = () => {
    const fields = collectFields();
    const scores = calculateScores();
    return {
      id: fields.recordId || createRecordId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields,
      items: assessmentItems,
      scores,
      report: {
        clinicalImpression: $("clinicalImpression").value,
        interventionPlan: $("interventionPlan").value
      }
    };
  };

  const saveRecord = async () => {
    const status = $("saveStatus");
    status.textContent = "正在保存...";
    const payload = collectPayload();
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (res.status === 401) {
        status.innerHTML = '保存需要有效评估师代码或管理员登录。请从首页重新输入评估师代码，或进入 <a class="font-bold text-brand-700 underline" href="/admin/login.html">后台登录</a>。';
        return;
      }
      if (!res.ok || !result.success) throw new Error(result.message || "保存失败");
      status.textContent = `已保存：${new Date().toLocaleString("zh-CN")}`;
    } catch (error) {
      status.textContent = `保存失败：${error.message}`;
    }
  };

  const exportJson = () => {
    const payload = collectPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.id || "assessment"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const loadDemo = () => {
    fillFields({
      recordId: createRecordId(),
      childName: "示例儿童",
      childSex: "男",
      birthDate: "2021-03-18",
      assessmentDate: todayString(),
      guardianName: "示例家长",
      guardianPhone: "13800000000",
      primaryConcern: "语言表达少，社交回应弱，课堂规则参与困难。",
      examiner: "启言评估师",
      site: "启言中心评估室",
      medicalHistory: "家长报告曾进行发育行为评估，听力筛查未见明显异常。此处为示例，不代表真实病史。",
      educationHistory: "已入园，能参与部分集体活动；既往接受言语与社交沟通训练。",
      instrumentName: "PEP-3 授权施测记录 + 启言临床观察",
      licenseNote: "请填写机构正版量表/材料编号",
      assessmentMode: "个别施测 + 家长访谈",
      caregiverSummary: "家长主要关注主动表达、同伴互动和情绪转换。日常能用少量词语表达需求，遇到变化时需要成人提示。",
      observationSummary: "评估中可短时间保持桌面活动，对熟悉材料参与度较高；共同注意和轮替需要提示，部分项目在视觉提示后可完成。"
    });
    calculateAgeMonths();
    assessmentItems = createStarterItems().map((item, index) => ({
      ...item,
      score: item.scoreScale === "ab"
        ? (index % 4 === 0 ? "B" : "A")
        : (index % 5 === 0 ? "0" : index % 3 === 0 ? "1" : "2")
    }));
    updateAll();
    renderReport();
  };

  const addItem = () => {
    assessmentItems.push({
      id: `item-${Date.now()}`,
      domain: activeDomain === "all" ? domains[0].id : activeDomain,
      title: "",
      prompt: "",
      manualRef: "",
      material: "",
      administration: "",
      criteria: "",
      scoreScale: "ab",
      score: "",
      observation: "",
      goal: ""
    });
    renderItems();
    renderSummary();
  };

  const resetItems = async () => {
    if (!window.confirm("确定要重置评估项目吗？当前项目记录会被替换。")) return;
    await loadAssessmentQuestionBank();
    assessmentItems = createStarterItems();
    updateAll();
  };

  const updateAll = () => {
    renderDomainTabs();
    renderItems();
    renderSummary();
    if ($("reportPreview").innerHTML.trim()) renderReport();
    if (window.lucide) window.lucide.createIcons();
  };

  const showStep = (stepId) => {
    activeStep = stepId;
    document.querySelectorAll(".step-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== activeStep);
    });
    document.querySelectorAll(".step-link").forEach((button) => {
      const isActive = button.dataset.stepTarget === activeStep;
      button.classList.toggle("bg-brand-50", isActive);
      button.classList.toggle("text-brand-700", isActive);
      button.classList.toggle("text-slate-600", !isActive);
      button.classList.toggle("hover:bg-slate-50", !isActive);
    });

    if (activeStep === "scoring" || activeStep === "chart") renderSummary();
    if (activeStep === "report") renderReport();
    if (window.lucide) window.lucide.createIcons();
  };

  const bindEvents = () => {
    document.addEventListener("click", (event) => {
      const domainBtn = event.target.closest("[data-domain-tab]");
      if (domainBtn) {
        activeDomain = domainBtn.dataset.domainTab;
        activeItemIndex = 0;
        renderDomainTabs();
        renderItems();
        return;
      }

      if (event.target.closest("[data-question-prev]")) {
        activeItemIndex = Math.max(0, activeItemIndex - 1);
        renderItems();
        return;
      }

      if (event.target.closest("[data-question-next]")) {
        const currentItems = assessmentItems.filter((item) => item.domain === activeDomain);
        activeItemIndex = Math.min(currentItems.length - 1, activeItemIndex + 1);
        renderItems();
        return;
      }

      if (event.target.closest("[data-next-domain]")) {
        const nextDomain = getNextDomain();
        if (nextDomain) {
          activeDomain = nextDomain.id;
          activeItemIndex = 0;
          renderDomainTabs();
          renderItems();
          renderSummary();
        } else {
          showStep("scoring");
        }
        return;
      }

      const toggleBtn = event.target.closest("[data-toggle-item]");
      if (toggleBtn) {
        const id = toggleBtn.dataset.toggleItem;
        if (expandedItemIds.has(id)) expandedItemIds.delete(id);
        else expandedItemIds.add(id);
        renderItems();
        return;
      }

      const removeBtn = event.target.closest("[data-remove-item]");
      if (removeBtn) {
        assessmentItems = assessmentItems.filter((item) => item.id !== removeBtn.dataset.removeItem);
        expandedItemIds.delete(removeBtn.dataset.removeItem);
        updateAll();
        return;
      }

      const stepBtn = event.target.closest("[data-step-target]");
      if (stepBtn) {
        showStep(stepBtn.dataset.stepTarget);
      }
    });

    $("itemsList").addEventListener("input", (event) => {
      const row = event.target.closest("[data-item-id]");
      const field = event.target.dataset.itemField;
      if (!row || !field) return;
      const item = assessmentItems.find((candidate) => candidate.id === row.dataset.itemId);
      if (!item) return;
      item[field] = event.target.value;
      renderSummary();
    });

    $("itemsList").addEventListener("change", (event) => {
      const row = event.target.closest("[data-item-id]");
      const field = event.target.dataset.itemField;
      if (!row || !field) return;
      const item = assessmentItems.find((candidate) => candidate.id === row.dataset.itemId);
      if (!item) return;
      item[field] = event.target.value;
      if (field === "scoreScale") item.score = "";
      updateAll();
    });

    ["birthDate", "assessmentDate"].forEach((id) => $(id).addEventListener("change", () => {
      calculateAgeMonths();
      renderSummary();
    }));

    $("assessmentPackage").addEventListener("change", (event) => {
      activePackage = event.target.value;
      activeItemIndex = 0;
      expandedItemIds = new Set();
      ensureActiveDomain();
      updateAll();
    });

    fieldIds.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        if (id === "clinicalImpression" || id === "interventionPlan") {
          el.dataset.autoGenerated = "false";
        }
        if (id === "recordId") $("sideRecordId").textContent = el.value || "未建立";
        if (["childName", "assessmentDate"].includes(id)) renderSummary();
      });
    });

    $("addItemBtn").addEventListener("click", addItem);
    $("resetItemsBtn").addEventListener("click", resetItems);
    $("recalculateBtn").addEventListener("click", renderSummary);
    $("generateReportBtn").addEventListener("click", renderReport);
    $("saveRecordBtn").addEventListener("click", saveRecord);
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("loadDemoBtn").addEventListener("click", loadDemo);
    $("printBtn").addEventListener("click", () => {
      renderReport();
      const originalTitle = document.title;
      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener("afterprint", restoreTitle);
      };
      window.addEventListener("afterprint", restoreTitle);
      document.title = "\u00a0";
      window.print();
    });

    window.addEventListener("resize", () => drawRadar(calculateScores().byDomain));
  };

  const init = async () => {
    $("recordId").value = createRecordId();
    $("assessmentDate").value = todayString();
    await Promise.resolve(window.__assessmentAccessPromise);
    await loadAssessmentQuestionBank();
    assessmentItems = createStarterItems();
    bindEvents();
    if (window.__currentAssessor?.name && $("examiner") && !$("examiner").value) {
      $("examiner").value = window.__currentAssessor.name;
      renderSummary();
    }
    updateAll();
    showStep(activeStep);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
