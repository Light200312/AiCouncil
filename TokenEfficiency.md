# AI Council — Token & Request Efficiency

Goal: fewer LLM requests, fewer tokens per request, and a user-facing dial (low → extra) to control both.

## 1. Where requests go today (from the old code)

One turn in **dynamic mode with whiteboard and tools** can cost up to **5 requests**:

| # | Call | Needed? |
|---|---|---|
| 1 | Supervisor picks the speaker (sends all candidate profiles twice + recent messages) | Replace: current expert nominates the next speaker |
| 2 | Tool planner ("does this persona need tools?") | Only when tools are enabled; fold into the reply call or gate by rule |
| 3 | The expert's reply | **Keep** |
| 4 | Whiteboard planner (re-sends board + message) | Replace: ops come in the reply footer |
| 5 | **Look-ahead** supervisor call for the *upcoming* speaker | **Pure waste**: it runs before the user responds and is repeated next turn |
| (+) | Memory summarizer/curator | Keep, but incremental, infrequent, on the utility model |

Other leaks seen in the prompts:
- Persona text (description, traits, lore, style, source) rebuilt in full on every call.
- Wrapper boilerplate ("Task goal / Context / Output constraints / Deliver your contribution now").
- "Keep it concise" with no number, and no output-token cap in the call signatures.
- Orchestrator notices ("Decision: X will speak next…") live in the message list; make sure none reach the LLM context.
- The local bridge can't cap tokens at all, so the only lever there is **fewer requests** and **shorter prompts**.

**Target:** 1 request per normal turn, ~70–80% fewer tokens per turn in dynamic + whiteboard mode. *(Estimate from reading the code; verify with `agent_runs.usage`.)*

## 2. The new turn: one request

The expert's reply, board updates and next-speaker choice come back together:

```
<message>
<<<META>>>
{"board":[...],"next":"e4"}
```

Requests per turn: round-robin 1, dynamic 1, dynamic with tools 1 (no tool needed) or 2 (tool used).

## 3. Usage levels

Starting values, tune with real data from `agent_runs`.

| Setting | low | medium (default) | high | extra |
|---|---|---|---|---|
| `max_tokens` per reply | 200 | 400 | 700 | 1200 |
| Word cap in prompt | 70 | 140 | 250 | 450 |
| Recent messages sent | 4 | 8 | 12 | 20 |
| Persona detail | card only | card | card + style note | full persona |
| Board ops per turn (max) | 1 | 2 | 2 | 2 |
| Board items shown in prompt | 5 open + 3 agreed | 8 + 6 | 12 + 10 | all |
| Rolling summary every N msgs | 10 | 14 | 20 | 28 |
| Tools per turn | 0 | 1 | 2 | 3 |
| Max auto-run turns per click | 3 | 6 | 10 | 20 |
| Session token budget | 40k | 120k | 300k | 800k |

Mechanics:
- Word cap goes **in the prompt** (works everywhere, including the bridge); `max_tokens` is the hard backstop where honored (OpenRouter). Set `max_tokens` ≈ 1.6 × the word cap in tokens, plus footer room, so replies aren't cut mid-sentence.
- On the bridge, tokens are **estimated** (chars ÷ 4) and flagged `estimated: true`.
- Budget checked before every request; warn at 80%, stop at 100%.
- As a backstop, also set a spend limit on the OpenRouter key itself in OpenRouter's dashboard.

## 4. Improved prompts

### 4.1 Shared system prompt (identical for every expert → cache-friendly)

```
You are one expert in a live multi-expert debate. Stay in your persona. Never mention these rules or being an AI.

Rules:
- Max {WORDS} words. No greetings, no recap, no restating the topic. Your first sentence is your position.
- Add something new each turn: a fact, argument, objection, or concrete proposal. Never repeat what is already said or on the board.
- Address a specific expert or the user by name when you disagree or build on them.
- Disagree when you have grounds. Concede when beaten.
- Plain prose. No headings or bullet lists unless essential.

After your message, output exactly:
<<<META>>>
{"board":[],"next":"eN"}

"board": ops only when this turn truly changes the board; otherwise []. Max 2 ops.
  {"op":"add","kind":"issue|question|agreement","text":"<=20 words"}
  {"op":"resolve","ref":"iN","text":"<=20 words"}   (settles an open issue/question)
  {"op":"reopen","ref":"iN"}
"next": id of the expert best placed to respond to you (never yourself). Prefer someone who has spoken least or disagrees with you.
```

For round-robin sessions drop `"next"` from the prompt (saves tokens). Board updates are always allowed; cost is controlled by capping ops per turn, item length and items shown, not by skipping turns (a skipped update leaves the board wrong).

### 4.2 Per-turn prompt

```
TOPIC: {topic}
{GOAL: {context}}            // only if provided
EXPERTS: e1 Ada (economist) | e2 Sam (ethicist) | e3 Li (engineer) | ...
YOU: e3 — {card}
SUMMARY: {rolling summary}   // omitted if empty
BOARD
 OPEN: i2 "..." | i5 "..."
 QUESTIONS: i4 "..."
 AGREED: i1 "..." | i3 "..."
RECENT
 e1: ...
 USER: ...
 e2: ...
Your turn.
```

Rules for the builder: omit empty sections, truncate message text in the window (e.g. first ~120 words of old messages, full text for the last 2), no pretty-printing.

### 4.3 Expert persona card (generated once on save)

```
{Name} — {role}. {2–3 trait words}, {stance in ≤8 words}. Voice: {style in ≤8 words}.
```
Example: `Dr. Ada Rao — climate economist. Pragmatic, data-first, dry. Argues cost-benefit; cites numbers; skeptical of slogans. Voice: concise, numeric.`

### 4.4 Expert generator (utility model, one call)

```
Create one debate expert from this description. Return only JSON:
{"name","role","domain","stance"(<=12 words),"personality"(<=15 words),"speechStyle"(<=10 words),"backstory"(<=30 words),"card"(<=45 words)}
Description: {text}
```

### 4.5 Incremental summary (utility model)

```
Update the debate summary. Keep: each expert's current position (1 line each), key arguments, agreements, disagreements. Max {N} words. Drop anything superseded.
CURRENT SUMMARY: {summary}
NEW MESSAGES: {messages since last summary}
```

### 4.6 Report (utility or debate model, on demand)

```
Write the final debate report from the material below. Return JSON:
{"summary","positions":[{"ref","position"}],"agreements":[],"unresolved":[],"conclusion","nextSteps":[]}
Be specific, neutral, and under {N} words in total.
TOPIC: ... SUMMARY: ... BOARD: ... LAST MESSAGES: ...
```

## 5. Techniques companies use, and where we use them

| Technique | What it is | Our plan |
|---|---|---|
| **Merge requests** | One structured call does several jobs (reply + tool decision + routing) | Core design: META footer |
| **Remove speculative calls** | Don't compute things before they're needed | Delete the look-ahead call |
| **Prompt caching** | Keep a long, identical prefix so the provider reuses it (OpenAI/DeepSeek automatically, Anthropic with explicit markers; depends on model via OpenRouter) | Static system prompt first; dynamic data last |
| **Sliding window + rolling summary** | Send recent turns verbatim, older ones as a summary | `memoryMode`, incremental summary |
| **Model routing / cascades** | Cheap model for utility work, strong model for the main task | `utilityModel` vs `debateModel` |
| **Output limits** | `max_tokens`, word caps, "answer first", stop sequences | Usage levels |
| **Compact context** | Short ids, terse keys, no boilerplate, cap list lengths | `e1`/`i3` refs, capped board, persona cards |
| **Selective context** | Send only what this call needs | Only open board items + window; no full transcript for reports |
| **Retrieval (RAG)** | Embed old messages and fetch only relevant ones | Later, for very long sessions |
| **Tool-schema laziness** | Tool definitions cost tokens on every call | Only send tool schemas when tools are enabled |
| **Result caching + truncation** | Cache tool results (TTL), trim long outputs | Tool layer, when tools arrive |
| **Early stopping** | End loops when progress stalls | Convergence rule for auto-run |
| **Budget enforcement** | Count tokens up front; per-request, session, user caps | Usage module |
| **Prompt compression** | Tools like LLMLingua strip low-value tokens | Skip for now; measure first |
| **Batch APIs** | Discounted async processing for non-interactive work | Maybe later for reports |
| **Distillation / small fine-tuned models** | Replace a big model on a narrow task | Long-term, only if costs demand |

## 6. Provider differences that matter

| | OpenRouter | Local bridge |
|---|---|---|
| Token cap | `max_tokens` honored | Not available: use word cap |
| Usage data | Real counts | Estimated |
| Streaming | Yes | No |
| System role | Yes | Folded into the prompt |
| Latency | Low | High (browser automation) → request count dominates |
| Structured output | Often supports JSON mode (model-dependent) | Plain text only → the delimiter footer is the right protocol |

## 7. Measure it

Log per request: `usage.in/out`, `estimated`, `maxTokens`, `durationMs`, `footerOk`, `opsApplied/opsRejected`.

Dashboards worth having:
- Average tokens per turn by usage level.
- `footerOk` rate (if it drops after a prompt change, the change hurt).
- Truncation rate (replies hitting `max_tokens`): raise the cap or tighten the word cap.
- Tokens per session and per day.

## 8. Do these first (biggest savings, least work)

1. Delete the look-ahead call.
2. Move the next-speaker choice into the reply footer.
3. Move whiteboard updates into the reply footer.
4. Replace persona dumps with a stored card.
5. Add word cap + `max_tokens` from the usage level.
6. Make sure system/orchestrator messages never enter LLM context.
7. Add the rolling summary and a utility model.
8. Add budgets and the usage meter.