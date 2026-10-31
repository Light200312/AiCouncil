# AI Council — Requirements (General Debate Platform)

> Rebuild of AI Council. Old repos (AI Council, AI Boardroom) stay as reference only.

## 1. Purpose

The user picks a **topic**, assembles a panel of **experts** (prebuilt or custom), and runs a structured multi-expert debate. A shared **whiteboard** tracks issues, questions and agreed points, and the user can generate a **report** at the end.

The core is **domain-agnostic**. Boardroom-style idea validation, teaching/coaching and similar flavors become *templates* on top of the same engine (post-MVP).

## 2. Scope and assumptions

| # | Assumption | Consequence |
|---|---|---|
| A1 | One user per session in the MVP | `members` array reserved in the schema for later collaboration |
| A2 | Only the `general` template ships in the MVP | Template mechanism exists; Boardroom/Teaching come later |
| A3 | Two LLM providers: **OpenRouter** (user's own key) and the **local bridge** (your FastAPI "api-box" that wraps ChatGPT/Gemini/etc.) | One provider interface; capabilities differ (see §3.3) |
| A4 | Cost control is a core feature | Usage levels, token budgets and "one request per turn" are requirements, not polish |
| A5 | The user drives the pace | Run one turn, auto-run up to N turns, or interject at any time |

**Priority:** **M** = must (MVP), **S** = should, **C** = could (later).

## 3. Functional requirements

### 3.1 Auth and settings
| ID | Requirement | P |
|---|---|---|
| AUTH-1 | Register / log in / log out (hashed passwords, JWT) | M |
| AUTH-2 | `GET /me`, profile page (account info, theme, sign out) | M |
| SET-1 | Settings page: provider, usage level, orchestration mode, memory mode, tools toggle | M |
| SET-2 | Settings are defaults; a session can override them at creation | S |

### 3.2 Experts
| ID | Requirement | P |
|---|---|---|
| EXP-1 | Library of prebuilt experts, filterable by domain and searchable | M |
| EXP-2 | Create a custom expert (name, role, domain, stance, personality, speech style, optional backstory, avatar) | M |
| EXP-3 | "Generate from description": one line in, a full draft expert out, editable before saving (one utility-model call) | S |
| EXP-4 | Edit/delete own experts; duplicate a prebuilt expert to customize it | M |
| EXP-5 | A compact **persona card** (≤ ~60 tokens) is generated on save and used in prompts | M |
| EXP-6 | Experts are snapshotted into the session at start; later edits don't change past sessions | M |

### 3.3 Providers and keys
| ID | Requirement | P |
|---|---|---|
| PRV-1 | User uploads an **OpenRouter API key**; the backend uses it for that user's requests. Stored encrypted, shown masked (last 4), never returned by the API | M |
| PRV-2 | "Test connection" and model choice: a **debate model** and a cheaper **utility model** (summaries, expert generation, reports) | M |
| PRV-3 | **Local bridge**: the bridge URL comes from **server env** (`LOCAL_BRIDGE_URL`), never from user input (avoids SSRF); the user only picks the upstream (e.g. chatgpt, gemini). Meant for local/self-hosted runs: a backend on EC2 cannot reach `localhost` on your machine. Behind a feature flag | M |
| PRV-4 | Choose the active provider in settings; override per session | M |
| PRV-5 | Server-level fallback key from env for local/self-hosted deployments | S |
| PRV-6 | Generic OpenAI-compatible local endpoint (Ollama, LM Studio) | C |
| PRV-7 | Each provider declares **capabilities** (streaming, reports token usage, honors `max_tokens`, system role). The engine adapts: e.g. the bridge has no streaming or usage data, so replies appear when complete and tokens are estimated | M |

### 3.4 Usage control
| ID | Requirement | P |
|---|---|---|
| USG-1 | Usage level setting: **low / medium / high / extra**, each mapping to a budget profile (max output tokens, history window, tools per turn, auto-run limit, session budget). See `TOKEN_EFFICIENCY.md` | M |
| USG-2 | Max output tokens enforced per request via `max_tokens` where supported, plus a word cap in the prompt | M |
| USG-3 | Session token budget: warn at 80%, hard stop at 100% | M |
| USG-4 | Optional daily per-user cap (needs atomic token reservation) | C |
| USG-5 | Every request records tokens in/out (reported, or estimated and flagged) | M |
| USG-6 | Usage view per session and per day | S |
| USG-7 | Auto-run stops on: max turns reached, budget hit, or convergence (no new board activity for 2 turns) | M |

### 3.5 Sessions and history
| ID | Requirement | P |
|---|---|---|
| SES-1 | Create a session: topic, optional context/goal, template (default `general`) | M |
| SES-2 | Select **2 to 12** experts | M |
| SES-3 | History: list, search, open, rename, delete, resume | M |
| SES-4 | Statuses: `draft → active → completed` (or `abandoned`) | M |
| SES-5 | A user can only access their own sessions | M |
| SES-6 | Start a new session from an old one (same topic, different experts) | C |

### 3.6 Conversation and orchestration
| ID | Requirement | P |
|---|---|---|
| MSG-1 | User can post a message anytime; all messages persist with sequence numbers | M |
| MSG-2 | Replies stream to the UI when the provider supports it | S |
| MSG-3 | A message can reference a message or a whiteboard card (`refersTo`) | M |
| MSG-4 | System/orchestrator notices are stored but **never sent to the LLM** | M |
| ORC-1 | **Round-robin** mode | M |
| ORC-2 | **Dynamic** mode: the speaking expert nominates the next speaker inside its own reply (no extra request). The choice is validated; invalid or missing nominations fall back to round-robin | M |
| ORC-3 | Optional "supervisor" strategy for dynamic mode (separate LLM call, off by default) | C |
| ORC-4 | `@expert` mention by the user routes that expert next (no LLM needed) | M |
| ORC-5 | Fairness rules: no immediate repeats, no expert dominates, an expert skipped for N turns is forced in | M |
| ORC-6 | A normal turn costs **exactly one LLM request** (reply + board updates + next speaker together) | M |
| ORC-7 | Controls: run one turn, auto-run N, pause | M |
| ORC-8 | Every turn is an `agent_run` (status, tokens, duration, error); failed turns can be retried alone | M |
| ORC-9 | Duplicate clicks or retries can never run two turns at once: one running turn per session, a `clientTurnId` for idempotency, a clear 409 conflict, and recovery of runs stuck in `running` | M |

### 3.7 Whiteboard
| ID | Requirement | P |
|---|---|---|
| WB-1 | Item kinds: **issue** (open problem/disagreement), **question**, **agreement** (settled point). Labels can be renamed by templates | M |
| WB-2 | Board updates come with the expert's reply (same request), capped at 2 ops per turn. Each op is validated independently: invalid ops are dropped, valid ones applied | M |
| WB-3 | User can add, resolve, reopen, delete and comment on items | M |
| WB-4 | Cards link to the raising/resolving messages; clicking scrolls to and highlights the message | M |
| WB-5 | Open items first; resolved items struck through with an expandable resolution | M |
| WB-6 | Comment on a card sends a chat message pinned to it | M |
| WB-7 | Audit history for every change (who, what, when) | M |
| WB-8 | AI and user edits never overwrite each other | M |
| WB-9 | Duplicate detection in code | S |
| WB-10 | Only a capped, compact board summary is injected into prompts | M |

### 3.8 Reports
| ID | Requirement | P |
|---|---|---|
| REP-1 | Generate a report on demand from the board + rolling summary + recent messages (never the whole transcript) | M |
| REP-2 | Structured output: summary, each expert's position, agreements, unresolved issues, conclusion, suggested next steps | M |
| REP-3 | Reports are stored and versioned; the report notes if it is stale (debate moved on) | M |
| REP-4 | Export to Markdown | S |

### 3.9 Tools (future-ready)
| ID | Requirement | P |
|---|---|---|
| TOOL-1 | A minimal tool registry interface (name, description, input schema, `run`) and a disabled-by-default integration point; nothing more in the MVP | M |
| TOOL-2 | No tools enabled in the MVP; tools are off by default | M |
| TOOL-3 | Later: Wikipedia, web search, news; per-session toggle; results cached and truncated | C |
| TOOL-4 | Tool schemas are only sent to the LLM when tools are enabled | M |

### 3.10 UX
| ID | Requirement | P |
|---|---|---|
| UX-1 | Flow: Auth → Home (history) → New debate (topic → experts) → Debate dashboard | M |
| UX-2 | Dashboard: topic header, expert ribbon, chat, whiteboard panel, run controls, usage meter | M |
| UX-3 | Collapsible sidebar (icon rail), auto-collapse on narrow screens | M |
| UX-4 | Loading, empty and error states everywhere | M |
| UX-5 | Debate replay | C |

## 4. User journeys

**J1 — Connect a provider.** Settings → paste OpenRouter key → Test → pick debate and utility models. (Or: configure the local bridge URL and upstream provider.)

**J2 — Start a debate.** New debate → enter topic → browse/filter experts, create a new one if needed → pick 2–12 → Start.

**J3 — Run it.** Choose round-robin or dynamic. Press "Next turn" or "Auto-run 5". Each turn: one expert replies, the board updates, the next speaker is set. The user can interject or `@mention` an expert.

**J4 — Steer with the whiteboard.** See open issues and questions, comment on a card (pins a message to it), manually resolve or delete a card.

**J5 — Wrap up.** Click Generate report; read the structured result; export it.

**J6 — Come back later.** Open history, search, resume a session with its chat, board and reports intact. Retry a failed turn.

**J7 — Hit the budget.** The usage meter turns amber at 80%; at 100% auto-run stops with a clear notice and the option to raise the usage level or continue manually.

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Cost | One request per normal turn; token usage measured per request; budgets enforced before sending |
| Reliability | Failed requests never corrupt a session; every turn is retryable; the chat reply is never lost because the board/next-speaker footer was malformed |
| Security | No user-supplied URLs reach the backend's HTTP client (SSRF); hashed passwords, JWT expiry, per-session authorization, provider keys encrypted at rest (AES-256-GCM) and never logged, rate limiting, secure headers |
| Validation | Zod on all request bodies, env config and LLM output |
| Testability | Pure functions (board ops, speaker selection, context builder, budget logic, reply parser) unit-tested without DB or LLM; a fake provider for integration tests |
| Maintainability | Feature modules, files ≲ 300 lines, no business logic in controllers |
| Portability | Docker Compose locally; works with OpenRouter or the local bridge |

## 6. Later / out of scope for the MVP

Collaboration, billing/plans, templates beyond `general` (Boardroom, Teaching), live tools, embedding-based retrieval for very long sessions, debate replay.

## 7. MVP definition of done

- [ ] J1–J7 work end to end with both providers
- [ ] All **M** requirements implemented
- [ ] Round-robin and dynamic both work; dynamic falls back cleanly
- [ ] A normal turn is exactly one request (verified from `agent_runs`)
- [ ] Usage levels measurably change tokens per turn
- [ ] Unit tests for board ops, reply parser, selectors, budget logic
- [ ] README with setup, architecture diagram and demo script

## 8. Open questions

1. Which upstream providers does the bridge expose, and what are its rate/latency limits? (Bridge is local/self-hosted only for now.)
2. Should experts ever debate fully autonomously beyond the auto-run cap?
3. Should reports be shareable via a public link?