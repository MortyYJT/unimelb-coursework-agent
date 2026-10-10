# 交接

> 单文件，只写当前状态，覆盖而不追加。信任之前先对照 `git status` 和 `git log`。
> 背景：`note/product/vision.md`、`note/product/roadmap.md`、`note/decisions.md`（#1–#38）、`~/Documents/career-plan/总纲.md`（线 2）。

- **最后更新：** 2026-10-11，`main` 在 PR #6 合并之后（`56e5762` 再加本交接 PR）
- **项目：** `coursework`：以课业为核心的个人行动中心；定位「让通用 agent 能可靠读写墨大课业数据的工具层和运行时」（#29）
- **OpenSpec change：** `v1-foundation`（M0，已批准 #33）。issue A 已完成；B、C、D 未开始

## 已完成（有证据）
- 设计：架构 A + 写入校验（#13、#14）、Hermes 跑主动循环（#16）、Node 24 + `node:sqlite`（#17、#18）、CLI + MCP（#30）、模块全部交付型 + 重复任务（#31）、依赖（#35）
- 原型 `design/prototype/index.html`，发布链接 https://claude.ai/artifact/H8qtQMCMj1As4GmYKcekx7 （用户「总体很满意」）
- 路线图批准（#32）：M0 → M1 → M2 → M3 → M4，整体目标 10/15 代码完成
- **issue A（#5）→ PR #6 已合并**：脚手架、`npm run check`（= `.claude/check.sh` = CI）、`coursework --version`、数据模型和约束。证据：本地 38 passed / 8 skipped，CI 首次运行通过，审查 1 轮通过

## 下一步（按顺序）
1. **给用户的 `TODO(human)`**（#34）：`src/domain/grade.ts` 的 `projectGrade()` 函数体。用 Learning 风格的「Learn by Doing」请求交给用户；测试在 `test/domain/grade.test.ts`（被 skip）。用户写完后：打开 skip、删掉「期望抛错」的占位测试、跑 `npm run check`。不阻塞第 2 步。
2. **并行派 issue B（存储）、C（返回格式）、D（抓取工具）**：按 `openspec/changes/v1-foundation/tasks.md` 第 3、4、5 组开 issue，按 `.claude/skills/dispatch/SKILL.md`（已更新：独立 clone、`< /dev/null`）派给 Codex。D 需要先装 `playwright`（已批准 #35）；用本机 Chrome（`channel: 'chrome'`），不下载浏览器。
3. **dsh 出题（补做）**：PR #6 合并后还没给 dsh 出题，按 dispatch skill 第 7 步补上（Stage 1：脚手架和数据模型）。不阻塞。
4. D 合并后提醒用户跑 `coursework capture`（任务 5.5），**趁课程还开着**把 Canvas / Ed 页面存进 `.local/`。
5. B、C、D 都合并后归档 `v1-foundation`，开始 M1（`v1-sync`）。

## 运行与验证
- `npm ci && npm run check`（`.claude/check.sh` 和 CI 跑同一条）；`npm run build` → `dist/cli.js`
- 原型预览：`.claude/launch.json` 的 `ui-prototype`（端口 4317）

## 陷阱
- **Codex 派活**：用独立 clone，不用 linked worktree（沙箱写不了主仓库 `.git/`）；后台运行必须 `< /dev/null`；沙箱不联网，依赖由 Claude 先装。
- **合并规则**（#10、#12）：审查「可以合并」+ CI 绿 → Claude 合并；带设计的 PR 需先在 decisions 记下用户的选择；审查最多 2 轮，没过交给用户。
- **个人邮箱已进公开历史**（#9、#11）：网页或 API 合并都会写入账号主邮箱，只有开 GitHub 邮箱隐私设置能根治。
- **仓库公开**：夹具只用合成数据；用户真实的课程代码和 Excel 内容不进仓库，推送前扫描。
- guard hook 按整条命令的字符串匹配：`rm -rf` 和 `~` 不要放在同一条命令里。
- 浏览器预览面板只在截图时推进 CSS 动画，以 DOM 状态为准。
- **额度**：Pro 套餐，2026-10-11 时 5 小时窗口已用 60%、本周 35%。长对话最贵（每轮重发整个上下文）；每完成一个里程碑就交接、开新对话。
- 用户本人的理由还空着：#6、#9、#15–18、#23、#27、#29。
