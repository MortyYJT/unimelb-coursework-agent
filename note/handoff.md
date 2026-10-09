# 交接

> 单文件，只写当前状态，覆盖而不追加。信任之前先对照 `git status` 和 `git log`。
> 完整背景见 `~/Documents/career-plan/总纲.md`（线 2）和 `~/Documents/career-plan/开发流程v2设计.md`。

- **最后更新：** 2026-10-10，`main` 在 `5aeb363`（PR #1 模板安装已合并）；分支 `claude/delegate-merge-gate` 把合并权交给 Claude（PR #2）
- **项目：** unimelb-coursework-agent（CLI 命令 `coursework`）：墨大课业 agent，覆盖 Canvas 和 Ed，全栈 TypeScript
- **远端：** github.com/MortyYJT/unimelb-coursework-agent（公开）
- **OpenSpec change：** 还没有（`openspec init --tools claude` 已完成）

## 已完成（有证据）
- 模板按 `~/Desktop/通用AI开发模板/README.md` 装好；`AGENTS.md` 79 行，项目块已填（技术栈命令留 TODO）
- guard hook：喂入「推 main」的 JSON 返回 exit 2；`settings.json` 校验通过
- 仓库级 git 身份：`MortyYJT` + noreply（只改了本仓库 config）
- 决策记录：`note/decisions.md`（1–12 条）
- 合并由 Claude 做：审查通过 + CI 绿；CI 建好前只有纯文档 PR 能合并，代码 PR 等 CI；设计 PR 需先记下用户的选择（决策 #10、#12）

## 下一步
1. **用户（不阻塞）：** 补 `note/decisions.md` 第 6、9 条的理由；强烈建议开 GitHub 邮箱隐私设置（见陷阱）。
2. **brainstorm 架构（唯一的人工关口：用户选设计）：** 「CLI/MCP 工具层 + 现成 agent 运行时（Codex / dsh / Claude / Hermes）」还是「自建编排」。先核实 Hermes（本机 `~/.hermes/hermes-agent`）和 Always Ontrack 的接入方式，给 2–3 个方案和推荐。
3. **技术选型**用 Context7 查最新文档（TS 运行时、包管理、测试、Playwright、Codex SDK、存储、调度），定下后配置 `.claude/check.sh` 和 CI，再开分支保护。
4. 写 OpenSpec change → 带排期的计划 → `dispatch` skill 派给 Codex。

## 运行与验证
- 还没有代码。`.claude/check.sh` 目前是空实现（直接 exit 0），技术选型后再写。

## 陷阱
- **个人邮箱已进公开历史**：`b79fa85` 的作者，以及 PR #1 rebase 合并后 3 个提交的提交者，都是账号主邮箱。用户决定不处理。merge、squash、rebase 三种合并方式都会写入，只有开 GitHub 邮箱隐私设置才能根治。
- guard hook 会匹配命令**字符串**：测试命令里出现 `git push … main` 也会被拦，测试要从文件喂 JSON。
- OpenSpec 只为 Claude 生成了 skills/commands；Codex 不需要（派活时直接给 issue 文本），装 Codex 那份会写全局 `~/.codex/`。
- **速度优先**：用户只在设计关键节点决策，合并由 Claude 做；dsh 出题异步进 `note/interview/`；关键决定不替用户做，记下理由。
- 给用户看的中文文档写完后直接弹出来（SendUserFile render）。
