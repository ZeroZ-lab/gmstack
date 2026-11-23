# gmstack 设计草案 v0.1

> 状态：设计已定稿，M0、M1 已实现。决策汇总见第 12 节。skill 正文用英文，本设计文档仍用中文。
>
> M1 的 tdd / plan / review / bug-fix 参考了 superpowers（test-driven-development、writing-plans、code-reviewer、systematic-debugging）、mattpocock（tdd、code-review、diagnosing-bugs）和 pstack（tdd、architect、bug-fix、feature）。
> 骨架参考 [pstack-claude](https://github.com/michael-denyer/pstack-claude)，底座是现有的 `checklist-project-init`（工程 checklist v1.2）。

## 1. 目标与非目标

**目标**
- 一个入口覆盖 AI 开发全周期：立项初始化 → 日常开发（功能 / 修 bug / 重构 / 调查）→ 审查 → 发布门禁 → 复盘。
- 所有"完成"都以可核验证据为准，证据统一落到仓库里的 `CHECKLIST.md` 和验证报告。
- 项目能覆盖或扩展内置流程，不必 fork 整套。

**非目标**
- 不做多模型、多厂商编排（pstack 的 arena / 多家族审查）。v1 只用 Claude Code 自带的子代理。
- 不做形式化验证、视频、教学类 skill。
- v1 不追求覆盖十几个 harness，只做 Claude Code；Codex 放到后面。

## 2. 从 pstack 借什么、改什么

| pstack 的做法 | gmstack 的取舍 |
|---|---|
| 单入口 `poteto-mode` + SessionStart hook 路由 | **借**：入口 `gm`，同样用 hook 路由 |
| 22 个 playbook | **精简**到 10 个，覆盖初始化和发布门禁这两块 pstack 没有的 |
| 约 25 个 `principle-*` 独立 skill | **改**：原则放进入口 skill 的 `references/principles/`，按路径读取，不占 skill 列表的预算 |
| 证据写在回复和 `.audit/` 决策记录里 | **改**：证据统一写进 `CHECKLIST.md`（项目级、长期）和 `reports/`（单次） |
| 项目级 playbook 放 `.agents/playbooks/`，用 After / Before / Replace 锚点扩展 | **借**，保留同样的锚点语法和一致性检查脚本 |
| 独立审查者，没有就 BLOCKED | **借**，并接到 GATE 门禁上 |
| 可逆操作直接做，不可逆操作停下 | **借**，不可逆清单直接复用 AGENTS.md 里的人工审批列表 |

## 3. 架构：四层 + 项目状态

```
┌──────────────────────────────────────────────┐
│ 入口层   gm（路由器）                          │  判断任务 → 选 playbook → 跑完 → 报告
├──────────────────────────────────────────────┤
│ 流程层   playbooks/*.md                       │  每个是一份有序步骤清单，复制进任务列表执行
├──────────────────────────────────────────────┤
│ 能力层   独立 skill（init / plan / tdd / …）   │  可以被 playbook 调用，也可以单独用
├──────────────────────────────────────────────┤
│ 原则层   references/principles/*.md           │  playbook 步骤按需引用，回复里注明用了哪条
└──────────────────────────────────────────────┘
            ↓ 读写
┌──────────────────────────────────────────────┐
│ 项目状态  AGENTS.md · CHECKLIST.md · verify 入口 │
│          docs/（PRD / ADR / risks）· reports/   │
│          .gm/playbooks/（项目级扩展）           │
│          .gm/trail/（单次任务决策记录，不提交）   │
└──────────────────────────────────────────────┘
```

项目状态层是 gmstack 和 pstack 最大的区别：pstack 每次会话自带规则；gmstack 把规则、门禁和证据**留在仓库里**，换一个 agent 或一个人来接手，也能按同一套状态继续。

## 4. 入口 `gm` 的硬规则

沿用 checklist-project-init 的 7 条核心原则，再加上路由规则：

1. 第一句话复述目标和满足目标的最小改动。
2. 仓库还没有 `CHECKLIST.md` → 先建议走 **init** playbook；用户拒绝就按无门禁模式继续，并在报告里写明。
3. 选定 playbook 后，把步骤原样复制进任务列表；跳过的步骤保留，写 `skip: <原因>`。
4. 写代码前先说清数据结构；改动跨模块边界 → 先调用 **plan**。
5. 每个 playbook 的最后两步固定：**verify** 和 **更新 CHECKLIST 证据**。
6. 需要独立审查的步骤，由新开的子代理执行，自审不算数。没有可用审查者 → 标 `BLOCKED: 独立审查`，GATE 不放行。
7. 可逆操作直接做；AGENTS.md 审批列表里的操作必须停下来问。
8. 回复用短句陈述，每条结论带证据或标注（实测 / 推断 / 猜测）。

## 5. Playbook（v1：10 个）

每个 playbook 都由同一个骨架展开：**目标 → 调查 → 方案 → 实现 → verify → 独立审查 → 更新 CHECKLIST → 报告**。

| Playbook | 何时用 | 和骨架相比的关键差异 |
|---|---|---|
| **init** | 新建项目或接入已有项目 | 就是现在的 checklist-project-init，拆成调用 init skill |
| **feature** | 新功能 | 先写验收标准，回填 PRD-02；跨边界时必须走 plan |
| **bug-fix** | 修 bug | 先复现，修完重跑失败用例；附修复前失败、修复后通过的证据 |
| **refactor** | 重构 | 先删后加；行为不变用现有测试证明 |
| **investigation** | 调查、回答"为什么" | 不改代码，产出结论 + 证据 |
| **prototype** | 有分歧、能跑一下就能决定 | 产物可丢弃，不进 CHECKLIST |
| **review** | 审查一个 diff 或 PR | 独立子代理执行，输出分级问题清单 |
| **gate** | "能发布了吗" | 重新核验 PASS 项，按 GATE 判断，列出阻断项 |
| **progress** | "检查进度" | 读 CHECKLIST，过期证据重新取证，给出接下来的 3 项 |
| **handoff** | 暂停、交接、新会话接续 | 写 `.gm/trail/` 交接记录；接续时先读它 |

## 6. 能力层 skill（v1）

| Skill | 职责 | 来源 |
|---|---|---|
| `gm` | 入口和路由，含 playbooks/ 与 principles/ | 新写 |
| `init` | 生成骨架、AGENTS.md、CHECKLIST.md、verify、CI | 从 checklist-project-init 拆出 |
| `checklist` | 读写 CHECKLIST.md：更新状态、校验证据格式、判断证据是否过期 | 从 checklist-project-init 拆出 |
| `plan` | 方案设计：数据结构、接口、模块边界、验收标准 | 新写，参考 pstack architect |
| `tdd` | 红绿重构 | 自己写。动笔前对照 superpowers、mattpocock、pstack 三家的 tdd skill，取各家长处 |
| `verify` | 运行项目 verify 入口，生成汇总表和报告 | 从 checklist-project-init 拆出 |
| `review` | 独立审查：正确性、范围、受保护文件是否被改 | 新写 |
| `deslop` | 提交前清理 AI 冗余代码和注释 | 新写，参考 pstack |
| `unslop` | 文档和回复去 AI 腔 | 可复用 gm-de-ai-article 的规则 |
| `agent-docs` | 维护 AGENTS.md / CLAUDE.md | 复用 gm-skills 里的 gm-agent-docs |

## 7. 原则（v1：12 条，放在 `gm/references/principles/`）

| 分组 | 原则 |
|---|---|
| 核心 | 最小改动 · 先删后加 · 先定数据结构 · 质疑前提（同一前提失败两次，先验证前提） |
| 架构 | 领域建模代替散落的条件分支 · 边界校验，内部信任类型 · 操作幂等 |
| 验证 | 用真实产物证明能用 · 修根因不打补丁 · 测行为不测实现 · 拆成可验证的小单元 |
| 委派 | 保护上下文窗口（大量输出交给子代理） |

每条一个文件，写明：何时适用、具体做法、反例。

**为什么放 references，不做成独立 skill**：
- 每个 skill 的 description 每次会话都会加载进上下文。12 条原则做成 skill，就要常驻 12 条描述，还会挤占 skill 列表的预算，导致真正要用的 skill 更难被选中。
- 原则不是用户会单独调用的任务，而是 playbook 某一步要遵守的约束。由 playbook 在对应步骤点名引用、按路径读取，加载时机更准。
- 将来如果真需要单独调用（比如"按这些原则审一下这段代码"），可以加一个 `principles` skill 作为索引，不用把每条都升格成 skill。

## 8. 证据模型

延续 checklist v1.2 的证据格式，所有 playbook 共用：

```
<日期或 commit> · <命令> · exit=<码> · <日志路径 | CI 链接 | 文件:行号 | PR 号>
```

- 单次任务的验证报告写入 `reports/verify-<时间戳>.log`（被 .gitignore 忽略）。
- 影响 checklist 条目的结论回填 `CHECKLIST.md`。
- 决策记录写入 `.gm/trail/<任务>.md`，默认不提交。

## 9. 项目级扩展

- 项目在 `.gm/playbooks/<名字>.md` 里扩展或新增 playbook，frontmatter 写 `extends`（基于哪个内置 playbook）和 `when`（适用于什么请求）。
- 修改语法沿用 pstack：`**After** "原步骤文字"`、`**Before**`、`**Replace**`、`**In**`。
- 附带一个检查脚本：内置 playbook 升级导致锚点失效时报错，不允许 agent 猜测插入位置。

## 10. 打包与分发

- 一个插件 `gmstack`，内含上面的多个 skill，外加一个 SessionStart hook（可关闭）。

### SessionStart hook（参照 pstack）

pstack 的做法：`hooks/hooks.json` 注册 SessionStart，在会话开始、恢复、清空和压缩后（matcher `startup|resume|clear|compact`）运行 `session-start.sh`，向上下文注入一段路由说明：
- 满足以下任一条件时调用入口 skill：改动超过一个文件或改了被别处调用的签名；涉及设计或架构选择；原因未知的 bug 或性能问题。
- 更小的任务（单文件、有明确测试、问答、一行改动）直接做，在真实产物上验证。
- 意图已经很明确时，直接调用对应的 skill（tdd、architect 等）。
- 用户指令（CLAUDE.md、AGENTS.md、直接要求）优先；与其他插件的会话启动指令共存。

gmstack 照此实现，再加一条：仓库根目录有 `CHECKLIST.md` 时，在注入的说明里提示这是一个受 gmstack 管理的项目。**默认开启**；开关放在用户或项目配置里，由 `setup` 类命令切换。
- 仓库结构：

```
.claude-plugin/plugin.json
hooks/session-start.*            # 路由提示
skills/gm/SKILL.md
skills/gm/playbooks/*.md
skills/gm/references/principles/*.md
skills/init/ · checklist/ · plan/ · tdd/ · verify/ · review/ · deslop/ · unslop/
scripts/check-playbooks.mjs
docs/DESIGN.md
```

- 发布后在 gm-skills 的 external-plugins.json 里登记为外部插件。

## 11. 里程碑

| 阶段 | 内容 | 完成标准 |
|---|---|---|
| M0 | 拆分 checklist-project-init 为 init / checklist / verify；搭好 `gm` 入口 + init、gate、progress 三个 playbook | 在一个空目录跑通 init，再跑 gate 能给出阻断项 |
| M1 | feature、bug-fix、review、plan、tdd + 12 条原则 | 在真实项目上完成一次功能、一次修 bug，CHECKLIST 证据齐全 |
| M2 | refactor、investigation、prototype、handoff、deslop、unslop；SessionStart hook | 不点名 skill，直接描述任务就能路由正确 |
| M3 | 项目级 playbook 扩展 + 检查脚本；评测集 | 准备一组典型请求，统计路由正确率和流程完成率 |
| M4 | Codex 支持（可选） | — |

## 12. 待决策

已定：
- 名字 `gmstack`
- v1 只做 Claude Code
- tdd 自己写，参考 superpowers / mattpocock / pstack
- skill 正文用英文；现有中文 checklist 迁移时翻译

待定：
- SessionStart 路由 hook 默认开启，可在配置里关闭
- 入口 skill 名 `gm`（调用形式 `/gmstack:gm`）
- 原则放在 `skills/gm/references/principles/`，不做成独立 skill（理由见第 7 节）

暂无待定项。
