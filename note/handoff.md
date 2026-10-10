# 交接

> 单文件，只写当前状态，覆盖而不追加。信任之前先对照 `git status` 和 `git log`。
> 背景：`~/Documents/career-plan/总纲.md`（线 2）、`note/product/vision.md`、`note/product/roadmap.md`、`note/decisions.md`（#1–#32）。

- **最后更新：** 2026-10-10，分支 `claude/v1-design`（`main` 在 `12397d2`），设计 PR #4 规格已批准（#33），待审查后合并
- **项目：** `coursework`：以课业为核心的个人行动中心；定位是「让通用 agent 能可靠读写墨大课业数据的工具层和运行时」（#29）
- **OpenSpec change：** `v1-foundation`（M0，已通过 `openspec validate --strict`，用户已批准 #33；`projectGrade()` 由用户亲手写 #34）

## 已完成（有证据）
- 架构 A + 写入校验（#13、#14）；Hermes 跑主动循环（#16）；Node 24 + `node:sqlite`（#17、#18）；CLI + MCP（#30）
- 原型 `design/prototype/index.html`：月历 / 周视图、教学周、模块（全部交付型，支持重复任务）、课程详情和成绩推算（含 hurdle 门槛）、Notion 分区、头像菜单（状态 / 度量 / 设置）。浏览器验证过桌面、375px、浅色和深色；用户「总体很满意」。发布链接：https://claude.ai/artifact/H8qtQMCMj1As4GmYKcekx7
- 路线图批准（#32）：M0 基建 → M1 取数与同步 → M2 协议 → M3 界面 → M4 主动循环与集成；整体目标 10/15 代码完成
- `vision.md`（三个优点 + 成功标准「下学期不再手动做 Excel」）、`resume-draft.md`

## 下一步
1. **用户批准 `v1-foundation` 规格（关口 1）**，并决定 `projectGrade()` 是否亲手写（TODO(human)）。批准后在 `note/decisions.md` 记下，再合并设计 PR（#12：设计 PR 需先记下用户的选择）。
2. 用 `dispatch` skill 开 issue A（任务组 1–2），派给 Codex；A 合并后 B、C、D 并行。
3. 用户尽快跑 `coursework capture`（任务 5.5），趁课程还开着把 Canvas / Ed 页面存到 `.local/`。

## 运行与验证
- 原型预览：`.claude/launch.json` 里的 `ui-prototype`（Node 静态服务器，端口 4317）。
- 还没有代码；`check.sh` 等 issue A 落地后才生效。

## 陷阱
- **个人邮箱已进公开历史**（#9、#11）：merge / squash / rebase 都会写入账号主邮箱，只有开 GitHub 邮箱隐私设置能根治。
- 仓库是公开的：夹具只用合成数据；用户的真实课程代码、Excel 内容不能进仓库（推送前扫描）。
- guard hook 按命令字符串匹配，测试时从文件喂 JSON。
- 浏览器预览面板只在截图时推进 CSS 动画，截图可能停在动画中途，以 DOM 状态为准。
- 用户本人的理由还空着：#6、#9、#15–18、#23、#27、#29。
