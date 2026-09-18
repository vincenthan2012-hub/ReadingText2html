# Reading Courseware Skill

**版本：** 1.5.9  
**Skill 名称：** `reading-courseware`

将英语阅读材料（教材截图、原文段落、OCR 文本等）转化为一套完整的互动教学产物：**Pre / While / Post 互动课件** + **配套学生练习册**，一次构建，双份输出。

---

## 适用场景

在以下需求时启用本 skill：

- 从教材截图或阅读篇章制作 **Reading 课件**
- 需要 **读前 / 读中 / 读后** 三阶段互动 HTML 课件
- 需要与课件内容匹配的 **Student Worksheet**（练习册）
- 用户提到：reading 课件、互动阅读课、worksheet、练习册、教材截图转课件

**不适用：** 非英语阅读课、自由手写 HTML 页面、从零生成 CSS/JS 框架。

---

## 快速上手：如何调用

本 Skill 可在任意支持**读文件 + 跑终端命令**的 AI 编程助手中使用。你只需提供阅读材料，让 Agent 按 `SKILL.md` 生成 JSON 并执行构建脚本即可。

**三步流程：**

1. **准备材料** — 上传教材截图、粘贴英文原文，或指定已有文本文件路径
2. **让 Agent 生成并构建** — 生成 `content.json` + `worksheet.json`，运行 `scripts/build.js`
3. **验收产物** — 运行 `scripts/validate.js`，在浏览器打开生成的 HTML

**前置依赖：** Node.js >= 18

### 各平台怎么调用

| 平台 | Skill 放哪里 | 怎么唤起 |
|------|-------------|----------|
| **Cursor** | `.cursor/skills/reading-courseware/` | 对话中 `@reading-courseware`，或直接描述需求（Agent 会自动匹配） |
| **Workbuddy** | 上传该skill到“技能”| 对话中使用“/”调用该skill， 上传截图或阅读文本|
| **Codex / Codex CLI** | 项目内任意路径，或将 `SKILL.md` 写入 System Prompt | 在任务中指定 skill 路径，要求输出 JSON 后执行 `build.js` |
| **Claude Code** | 项目根目录下任意路径 | 直接说「用 reading-courseware 把某文件转成课件」 |
| **其他 Agent**（Windsurf、Cline 等） | 同上 | 让 Agent 阅读 `SKILL.md` 并按其中流程执行 |

### 一句话 Prompt（复制即用）

```text
请使用 reading-courseware skill，根据我提供的英语阅读材料（截图/文本）生成互动课件和配套练习册。
输出到 ./output 目录，先生成 JSON，再运行 scripts/build.js 和 scripts/validate.js。
```

**Cursor 示例：**

```text
@reading-courseware 把这份阅读教材做成 Pre/While/Post 课件和练习册，输出到 ./output/lesson-01
```

**Workbuddy 示例：**

```text
请阅读 @reading-courseware/SKILL.md，根据我上传的教材截图生成课件与练习册 JSON，
并运行 node scripts/build.js 构建 HTML。
```

**Codex CLI 示例：**

```text
Follow reading-courseware/SKILL.md: read materials/passage.txt, write content.json and
worksheet.json, then run node scripts/build.js and node scripts/validate.js into ./dist.
```

更完整的平台说明（含 Workbuddy 企业上传 ZIP、Codex 自动化流水线等）见下文 [在常见平台与 Agent 中使用](#在常见平台与-agent-中使用)。

---

## 核心理念

| 原则 | 说明 |
|------|------|
| **内容即 JSON** | 所有教学内容写入规范化 JSON，不直接改 HTML |
| **布局即模板** | 视觉与交互由固定 HTML 模板锁定，保证风格一致 |
| **一次构建** | 一条命令同时生成课件 + 练习册 |
| **内容可追溯** | 练习册词汇与句式必须来自读中环节的语言点 |

---

## 目录结构

```
reading-courseware/
├── SKILL.md                    # Agent 执行指令（Cursor 自动读取）
├── README.md                   # 本说明文档
├── VERSION                     # 当前版本号（须与 manifest.yaml 一致）
├── manifest.yaml               # WorkBuddy 企业上传必填元数据
├── config.yaml                 # WorkBuddy 桌面/市场可选元数据
├── assets/
│   ├── lesson.html.template    # 课件 HTML 模板
│   └── worksheet.html.template # 练习册 HTML 模板
├── references/
│   ├── lesson-schema.md        # 课件 JSON 字段规范
│   ├── worksheet-schema.md     # 练习册 JSON 字段规范
│   └── release-gates.md        # 发布前人工验收清单
├── scripts/
│   ├── build.js                # 统一构建入口
│   ├── build_lesson.js         # 课件构建
│   ├── build_worksheet.js      # 练习册构建
│   ├── validate.js             # 统一校验入口
│   ├── validate_lesson.js      # 课件校验
│   ├── validate_worksheet.js   # 练习册校验
│   ├── validate_skill.js       # Skill 包元数据校验（WorkBuddy）
│   └── package_skill.js        # 打包 WorkBuddy 上传 ZIP
└── evals/fixtures/caribbean/   # 示例数据（加勒比讲故事）
    ├── content.json            # 课件内容
    └── worksheet.json          # 练习册内容
```

---

## 工作流程

### 第一步：确认输入

需要准备：

1. **英语阅读原文** — 纯文本、截图 OCR、或结构化笔记均可
2. **独立输出目录** — 构建产物写入指定文件夹

**注意：**

- 先从截图提取结构化内容，**不要凭空编造缺失段落**
- 练习册题目必须基于读中环节的语言内容（Power Words、Phrases、Structures、Text Structure 思维导图）

### 第二步：编写 JSON

阅读规范文档：

- [references/lesson-schema.md](references/lesson-schema.md) — 课件结构
- [references/worksheet-schema.md](references/worksheet-schema.md) — 练习册结构

准备两份 JSON（或合并为一个 `package.json`），**两者 `meta.filenameStem` 必须一致**。

#### 课件 JSON 结构概览

```json
{
  "meta": { "titleEn", "filenameStem", "lessonType", "objectives", "timeEstimate" },
  "teacherTips": { "leadin", "debate", "exit" },
  "preReading": { "leadIn", "prediction", "keyWords" },
  "whileReading": {
    "passageParagraphs", "gist", "structure", "textWalkthrough",
    "deepDive", "powerWords", "phrases", "structures", "trueFalse", "vocabMatch"
  },
  "postReading": {
    "predictionCheck", "speaking", "textToSelf", "textToWorld", "exitTicket"
  }
}
```

#### 练习册 JSON 结构概览

```json
{
  "meta": { "titleEn", "filenameStem" },
  "matching": { "directions", "items" },
  "fillInBlank": { "directions", "wordBank", "items" },
  "imitation": { "directions", "items" },
  "paragraphImitation": { "directions", "sourceTag", "logicSteps", "scenarios" },
  "summary": { "directions", "wordBank", "segments", "answers" }
}
```

#### 合并 package.json 格式

```json
{
  "lesson": { "meta": { ... }, "preReading": { ... }, "whileReading": { ... }, "postReading": { ... } },
  "worksheet": { "meta": { ... }, "matching": { ... }, "fillInBlank": { ... }, "imitation": { ... }, "paragraphImitation": { ... }, "summary": { ... } }
}
```

参考示例：`evals/fixtures/caribbean/content.json` + `worksheet.json`

### 第三步：构建

在 skill 目录下执行（需 Node.js）：

```bash
# 推荐：两份独立 JSON
node scripts/build.js /path/to/content.json /path/to/worksheet.json /path/to/output

# 单文件 package.json
node scripts/build.js /path/to/package.json /path/to/output

# 仅构建课件
node scripts/build.js --lesson-only /path/to/content.json /path/to/output

# 仅构建练习册
node scripts/build.js --worksheet-only /path/to/worksheet.json /path/to/output
```

#### 构建产物

| 文件 | 说明 |
|------|------|
| `<stem>_Reading_Lesson.html` | Pre / While / Post 互动课件 |
| `<stem>_Student_Worksheet.html` | 配套学生练习册 |
| `source/normalized_content.json` | 规范化后的课件 JSON |
| `source/normalized_worksheet.json` | 规范化后的练习册 JSON |
| `source/package-build-record.json` | 构建记录（时间戳、来源路径等） |

### 第四步：校验与验收

```bash
# 校验课件 + 练习册
node scripts/validate.js /path/to/output

# 仅校验课件
node scripts/validate.js /path/to/output --lesson-only

# 仅校验练习册
node scripts/validate.js /path/to/output --worksheet-only
```

静态校验通过后，还需按 [references/release-gates.md](references/release-gates.md) 在浏览器中人工验收（阶段导航、高亮持久、翻转卡片、TTS 等）。

---

## 快速示例

从项目根目录运行 Caribbean 示例：

```bash
node .cursor/skills/reading-courseware/scripts/build.js \
  .cursor/skills/reading-courseware/evals/fixtures/caribbean/content.json \
  .cursor/skills/reading-courseware/evals/fixtures/caribbean/worksheet.json \
  .
```

生成：

- `Storytelling_in_the_Caribbean_Reading_Lesson.html`
- `Storytelling_in_the_Caribbean_Student_Worksheet.html`

---

## 课件功能一览

### 读前（Pre-Reading）

- Lead-in 热身提问
- Prediction 预测活动
- Key Words 阻塞词翻转卡片（4–6 个）

### 读中（While-Reading）

- **左侧：** 带编号段落 + Web Speech TTS（段落朗读、词汇发音）
- **右侧活动面板：**
  - **Gist** — 主旨选择题 + 段落功能配对
  - **Exploring Content**
    - Text Walkthrough — 段落精读卡片（含 Paragraph Logic；多段 section 共用顶部 Signpost 图例；可点击色块后用浮动 +/− 手动补标）
    - Deep Dive — 综合理解（2–6 条内容驱动要点）
    - Text Structure — 篇章结构思维导图（hub / timeline / compare / problem-solution）
  - **Exploring Language** — Power Words、Phrases、Structures 翻转卡片
  - **Comprehension Check** — 判断题 + 词汇配对
  - Details 二级 Tab（Exploring Content / Language / Check）与一级 Tab 同行右对齐，便于左右栏顶对齐

### 读后（Post-Reading）

- Prediction Check
- Speaking（至少 2 个口语提示）
- Text-to-Self
- Text-to-World（立场辩论，至少 2 个立场）
- Exit Ticket

### 其他

- 教师提示（Teacher Tips）弹窗
- 导出菜单：Export all as HTML / Export current as PDF

---

## 练习册题型一览

| 题型 | 来源 | 说明 |
|------|------|------|
| Matching | Power Words + Phrases | 词汇 ↔ 英文释义配对（6–8 题） |
| Fill-in-the-Blank | Power Words + Phrases | 选词填空，共享词库（5 题） |
| Sentence Imitation | Structures | 句式仿写，无标准答案（3–4 题） |
| Paragraph Imitation | Text Walkthrough 逻辑链 | 段落仿写，选场景写作（2–3 场景） |
| Summary | Text Structure 思维导图 | 摘要完形填空，长度随文本难度调整 |

---

## 内容编写要点

### 课件

- **Deep Dive** 标题与要点数量必须贴合文章，禁止默认「Three Big Ideas」或固定四条
- **Text Structure** 的 `layout` 须匹配文章组织方式（描述型 → hub，时序型 → timeline，对比型 → compare，问题解决型 → problem-solution）
- **Paragraph Logic / Signpost**：每段或每个 Section 只标最主要的 cohesive devices / signpost words（通常每卡 1–4 处），不罗列每个连接词；关系从句标记（who / which / that / where / in which）不要标成 `dm`
- **多段 Section Logic**：`data-step` 在整张卡片的所有 `targets` 段落上连续编号 1…N，禁止每段第一句都标 `data-step="1"`；每步只包住与该 chip 标题对应的内容
- **Power Words / Phrases** 难度须达到或高于篇章水平，跳过过于基础的词汇（如 gently、differ）
- **passageParagraphs** 须含稳定 id（`para-N`、`pw-*`、`phrase-*`、`sent-*`）供高亮联动

### 练习册

- Matching 释义用英文，不用中文
- Summary 长度：简单/短文本 < 100 词；长/难文本 150–200 词；过长时分段
- 所有题目内容须可追溯到课件读中语言点

---

## 边界与限制

- 仅支持英语 Reading & Writing 课型（Pre / While / Post + Worksheet）
- 不要从零重写 CSS/JS，除非明确要求修改模板
- 不要将受版权保护的教材页面图片嵌入公开 HTML
- 练习册客观题答案在 Submit 前隐藏；句式/段落仿写无标准答案
- 修改内容应编辑 JSON 后重新构建，**不要手改生成的 HTML**

---

## 反模式（避免）

| 错误做法 | 正确做法 |
|----------|----------|
| 调用多个独立 skill | 只用 `reading-courseware` 一个 skill |
| 手改构建后的 HTML | 改 JSON → 重新 `build.js` |
| 练习册词汇与课件无关 | 全部来自读中 Power Words / Phrases / Structures |
| 每篇文章都用 radial hub 结构图 | 按文章类型选 layout |
| 跳过 validate 和 release-gates | 构建后校验 + 浏览器人工验收 |

---

## 在常见平台与 Agent 中使用

本 Skill 采用 **「规范文档 (Markdown) + 数据格式 (JSON) + 构建脚本 (Node.js)」** 的标准架构设计，具备极强的跨平台兼容性。只要所用 AI 工具具备**文件读写**与**终端/脚本执行**（或协助用户执行）能力，即可无缝使用。

> **前置依赖：** 运行环境需安装 Node.js（推荐 Node.js >= 18）。

---

### 1. Cursor

Cursor 原生支持 Skills 规范：

- **存放路径**：放入项目根目录下的 `.cursor/skills/reading-courseware/`。
- **调用方式**：在 Composer / Chat 窗口中，Cursor 会根据 `SKILL.md` 自动识别匹配意图；也可显式 `@reading-courseware` 或提示词调用：
  > “请使用 reading-courseware skill，把这份阅读教材/截图制作成互动课件和配套练习册，输出到 ./output 目录。”
- **执行流程**：Cursor Agent 会自动按 `SKILL.md` 提取结构化数据、生成 JSON 并调用终端执行 `node scripts/build.js` 及 `node scripts/validate.js`。

---

### 2. Workbuddy

Workbuddy 支持工作区多模态解析与智能体执行：

- **存放路径**：将 `reading-courseware` 文件夹放置在当前工作区内（例如 `skills/reading-courseware` 或 `.codebuddy/skills/reading-courseware`）。
- **调用方式**：
  - **多模态输入**：直接在对话框上传教材截图或粘贴阅读篇章文本。
  - **指令提示**：在对话中引用 `SKILL.md`，例如：
    > “请阅读 `@reading-courseware/SKILL.md` 规则。根据我上传的教材图片，按照 `references/lesson-schema.md` 和 `references/worksheet-schema.md` 生成课件与练习册 JSON，并运行 `scripts/build.js` 构建出最终的 HTML 课件与练习册。”
- **执行亮点**：Workbuddy 会先进行 OCR 和结构化提取，生成符合 Schema 的 JSON，随后直接通过内置终端运行 Node 构建与验证脚本。

#### WorkBuddy 上传 Skill 包

企业/管理端上传需要 **ZIP 包内包含 `SKILL.md` + `manifest.yaml`**（不能只传文件夹或缺少 manifest）。

```bash
cd .cursor/skills/reading-courseware

# 1. 校验 Skill 元数据
node scripts/validate_skill.js

# 2. 生成上传 ZIP（自动排除 .git / .DS_Store）
node scripts/package_skill.js
# 输出：dist/reading-courseware-1.5.0.zip
```

**若报错 `requires a higher package version`：**

1. 确认 ZIP 根目录有 `manifest.yaml`，且 `version` 字段存在。
2. 若该 Skill 曾上传过，**新版本号必须高于已发布版本**（同步修改 `VERSION`、`manifest.yaml`、`config.yaml`）。
3. 不要整包压缩含 `.git` 的目录；请用 `package_skill.js` 生成干净 ZIP。
4. 课件构建脚本 `build.js` 与此无关；该错误来自 Skill 包元数据，不是 HTML 构建失败。

每次发版请递增 `VERSION` / `manifest.yaml` / `config.yaml` 中的 `version`（语义化版本，如 `1.5.0` → `1.5.1`）。

---

### 3. OpenAI Codex / Codex CLI / 脚本环境

在 Codex 或通过 API 驱动的自动化代码生成/智能体环境中：

- **Prompt 配置**：
  - 将 `SKILL.md` 及 `references/*.md` 的内容作为 System Prompt 或上下文参考文件传入。
  - 规定 Agent 的输出规范：接收阅读材料输入 $\rightarrow$ 输出标准结构化的 `content.json` 与 `worksheet.json`（或单个 `package.json`）。
- **执行步骤**：
  1. 调用模型生成符合规范的 JSON 文件保存在临时目录。
  2. 调用 Shell 执行构建脚本：
     ```bash
     node /path/to/reading-courseware/scripts/build.js /path/to/content.json /path/to/worksheet.json /path/to/dist
     node /path/to/reading-courseware/scripts/validate.js /path/to/dist
     ```
  3. 捕获产物 HTML 作为交付结果。

---

### 4. Claude Code / Claude Desktop

- **Claude Code (CLI)**：
  在项目根目录启动 Claude Code，直接下达任务：
  > “使用 reading-courseware 将 materials/passage.txt 转换成课件与练习册，输出到 dist/lesson-01。”  
  Claude Code 具备本地终端权限，会自动生成 JSON $\rightarrow$ 执行构建 $\rightarrow$ 进行验证。
- **Claude Projects / Web 端**：
  1. 将 `SKILL.md`、`lesson-schema.md`、`worksheet-schema.md` 上传至 Project Knowledge。
  2. 提供阅读材料，让 Claude 生成 `content.json` 与 `worksheet.json`。
  3. 本地下载 JSON 后，手动运行 `node scripts/build.js content.json worksheet.json ./output` 即可生成课件与练习册。

---

### 5. 其他 Agent 工具（Windsurf、Cline、Roo Code、Antigravity 等）

- **通用机制**：无论使用哪款 AI 编程助手或智能体，只要引导 Agent 参考本目录下的 `SKILL.md`，Agent 即可遵循标准流程：
  1. **解析输入** $\rightarrow$ 提取阅读文本与语言重点。
  2. **生成 JSON** $\rightarrow$ 输出课件与练习册数据。
  3. **构建验证** $\rightarrow$ 运行 `scripts/build.js` 与 `scripts/validate.js`。

---

### 常用 Prompt 模板

无论在哪个平台，您都可以直接复制以下 Prompt 快速发起任务：

```markdown
请使用 reading-courseware skill 处理以下英语阅读材料：

【材料内容/截图】：（上传附件或粘贴文本）
【输出目录】：./output/lesson-01

执行要求：
1. 严格遵守 SKILL.md 与 references/ 目录下的 schema 规范；
2. 先生成 content.json 和 worksheet.json（练习册词汇必须来自读中 Language Focus）；
3. 运行 scripts/build.js 完成 HTML 构建；
4. 运行 scripts/validate.js 确保所有校验通过并报告结果。
```

---

## 相关文档

- [SKILL.md](SKILL.md) — Agent 执行指令
- [references/lesson-schema.md](references/lesson-schema.md) — 课件 JSON 完整规范
- [references/worksheet-schema.md](references/worksheet-schema.md) — 练习册 JSON 完整规范
- [references/release-gates.md](references/release-gates.md) — 发布验收清单
