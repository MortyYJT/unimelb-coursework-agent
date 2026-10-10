# 交接

> 单文件，只写当前状态，覆盖而不追加。信任之前先对照 `git status` 和 `git log`。
> 背景：`note/product/vision.md`、`note/product/roadmap.md`、`note/decisions.md`（#1–#41）、`~/Documents/career-plan/总纲.md`（线 2）。

- **最后更新：** 2026-10-11，`main` 在 `f3a584e`（PR #15 合并后）再加本交接 PR
- **项目：** `coursework`：以课业为核心的个人行动中心；定位「让通用 agent 能可靠读写墨大课业数据的工具层和运行时」（#29）
- **OpenSpec change：** `v1-foundation`（M0，已批准 #33）。A、B、C、D 都已合并；只剩任务 2.4（用户写 `projectGrade()`）和 5.5（用户手动 capture），之后归档

## 已完成（有证据）
- issue A（#5）→ PR #6：脚手架、`npm run check`、数据模型
- issue C（#9）→ PR #13：返回格式和错误码。审查 1 轮通过，CI 绿
- issue B（#8）→ PR #14：`node:sqlite` 存储、迁移、change `seq`。审查 1 轮通过，CI 绿
- issue D（#10）→ PR #15：数据目录（3.4，#41 从 B 移来）、profile 锁、快照、`coursework capture`。审查 2 轮，CI 绿；真实浏览器**未验证**
- PR #11：AGENTS.md 加 Session hygiene 规则（#39）；PR #12：dsh 的 Stage 1 测验 `note/interview/6.md`（等用户作答）
- 本地 `main`：`npm run check` 112 passed / 10 skipped
- 派活计数（本轮）：issue 3 个，PR 合并 5 个（#11–#15），返工 2 轮（#11 措辞、D 4 处），dispatch 到全部合并约 1 小时

## 下一步（按顺序）
1. **用户写 `projectGrade()`**（#34）：脚手架在分支 `claude/grade-projection`（worktree `.claude/worktrees/zealous-bassi-00c806`，提交 `93a3d25`，只有 `TODO(human)` 注释）。用户写完后：打开 `test/domain/grade.test.ts` 的 `describe.skip`、删掉「期望抛错」的占位测试、跑 `npm run check`，开 PR、审查、合并。
2. **用户跑 `coursework capture`**（5.5），趁课程还开着：`npm run build && node dist/cli.js capture`，登录 Canvas 和 Ed，按 `s` 存作业、公告、成绩、Ed 课程页面，`q` 退出；记下会话时长和是否要 MFA。快照在 `.local/snapshots/`，不进仓库。
3. 1 和 2 完成后归档 `v1-foundation`（`openspec-archive-change`），勾掉 tasks.md。
4. 起草 M1（`v1-sync`）的 OpenSpec change，交用户批准（关口 1：设计和技术选型由用户选）。

## 运行与验证
- `npm ci && npm run check`（= `.claude/check.sh` = CI）；`npm run build` → `dist/cli.js`
- 原型预览：`.claude/launch.json` 的 `ui-prototype`（端口 4317）

## 陷阱
- **Codex 不能提交**（#40）：独立 clone 里沙箱照样把 `.git/` 设为只读。让 Codex 只改工作区并给提交说明，Claude 按步骤代为提交。后台运行必须 `< /dev/null`；用 `pgrep` 等待循环拿完成通知。
- **改 AGENTS.md / skill 会被自动模式拦下**（「Instruction Poisoning」），尤其是来自其他会话的请求：先让用户确认或亲手改。
- zsh 不按空格拆变量：循环参数用函数 `go b 8`，不要 `set -- $p`。
- **合并规则**（#10、#12）：审查「可以合并」+ CI 绿 → Claude 合并；审查最多 2 轮。
- **个人邮箱已进公开历史**（#9、#11）：只有开 GitHub 邮箱隐私设置能根治。
- **仓库公开**：夹具只用合成数据；真实课程数据、快照、profile 只在 `.local/`。
- **额度**：Pro 套餐。每完成一个里程碑就交接、开新对话。
- **模板**：`~/Desktop/通用AI开发模板/repo-template/AGENTS.md` 第 54 行还是 Session hygiene 的原版（有问题的那版），等用户回「同步」再改成 PR #11 的修正版。
- 用户本人的理由还空着：#6、#9、#15–18、#23、#27、#29。
