# AI COUNCIL — PROJECT HANDOFF & COMPLETE DEVELOPMENT BLUEPRINT

## 1. ROLE AND PRIMARY OBJECTIVE

You are taking over the development of an existing project called **AI Council**.

Your responsibility is to continue developing the project from its current state, following the existing architecture, design decisions, requirements, and development progress.

This is NOT a request to rebuild the application from scratch.

Your priorities, in order:

1. Understand the existing codebase and identify what is already implemented.
2. Preserve working functionality and existing architectural decisions.
3. Complete the debate workspace and connect it to the existing backend.
4. Implement the debate engine and its interaction modes.
5. Implement the whiteboard and other supporting features.
6. Complete the remaining application features.
7. Test, simplify, and improve the codebase.

### Critical development philosophy

- Prefer simple, maintainable implementations.
- Write only the code that is actually necessary.
- If existing code can be simplified, simplify it rather than introducing another abstraction.
- Do not create unnecessary hooks, utilities, services, components, or files.
- Avoid overengineering.
- Do not duplicate existing functionality.
- Do not replace working code merely because you prefer another implementation.
- Keep components reasonably small, but don't split every few lines into separate files.
- Preserve the existing visual identity.
- Explain significant architectural decisions before implementing them.
- Never claim something is implemented without verifying it.

The user prefers straightforward JavaScript and practical explanations. Do not introduce a TypeScript migration or rewrite the existing codebase without asking first.

---

# 2. PROJECT OVERVIEW

AI Council is a multi-expert AI discussion platform.

A user creates a debate session by selecting:

- A discussion topic.
- Relevant domains.
- A group of AI experts.
- A debate interaction mode.
- A response/argument limit.

The selected experts then participate in a structured discussion.

Each expert has:
- A name.
- A professional or philosophical role.
- A description.
- Areas of expertise.
- A backstory.
- A speaking style.
- Character traits.
- Optional inspiration/reference.
- A system prompt defining their behavior.

The purpose is to simulate a meaningful discussion between different perspectives rather than simply asking multiple LLMs the same question.

The user should be able to:
- Observe the discussion.
- Participate in the discussion.
- Control how the debate progresses.
- Ask questions.
- Interact with individual experts.
- Listen to the discussion.
- Track important issues and conclusions on a shared whiteboard.
- Generate a final debate report.

The application should feel like a polished AI collaboration and debate workspace.

---

# 3. EXISTING TECHNOLOGY STACK

Preserve the stack already present in the repository.

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Zustand for lightweight UI state
- TanStack Query for server state and API communication
- Axios for HTTP requests
- Lucide React for icons

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Zod for request validation
- JWT authentication
- Password hashing using the existing authentication implementation

### AI integration

The intended architecture supports:

1. OpenRouter for cloud LLM providers.
2. A local FastAPI-based API service called `api-box`.
3. Configurable model/provider selection.
4. Different model budgets.

The backend should be responsible for LLM communication. Never expose provider secrets or API keys to the browser.

### Development and testing

- Docker and Docker Compose where already configured.
- Vitest for unit testing.
- Supertest for backend integration testing.
- React Testing Library for frontend testing.
- Playwright for important end-to-end flows.
- GitHub Actions for CI.

Do not introduce these tools again if they already exist.

---

# 4. CURRENT PROJECT ARCHITECTURE AND FUNCTIONALITY

First inspect the actual repository.

The following describes the architecture and implementation already established. Verify the current source files before changing anything.

## 4.1 Authentication

Authentication functionality has been developed.

Expected functionality:

- User registration.
- User login.
- User logout.
- Current-user retrieval.
- Protected frontend routes.
- Backend authentication middleware.
- JWT-based authentication.
- HTTP-only cookies where implemented.

The frontend uses a `useCurrentUser` hook.

Preserve the current authentication flow.

## 4.2 Expert management

The application supports saved experts and temporary/custom experts.

Experts can contain:

- Name.
- Role.
- Description.
- Expertise.
- Backstory.
- Speech pattern.
- Character traits.
- Inspiration.
- System prompt.

The debate session should preserve a snapshot of each selected expert so that future modifications to the original expert do not change historical debates.

Temporary experts should also be supported.

## 4.3 Domains

Users select relevant discussion domains during configuration.

The backend validates selected domain IDs and stores domain names in the session.

Preserve this validation and snapshot behavior.

## 4.4 Debate configuration

The configuration flow includes:

- Topic entry.
- Domain selection.
- Expert recommendations/suggestions.
- Debate settings.
- Argument limit.
- Navigation to expert selection.

A floating bottom summary/navigation bar has been implemented on the configuration page.

The expert-selection page should use a consistent interaction pattern.

## 4.5 Expert selection

The expert-selection page includes:

- Expert listing.
- Search and filtering.
- Selecting experts.
- A selection limit of 2–12 experts.
- Custom expert creation.
- AI-suggested experts.

The bottom floating navigation bar should display:
- Selected expert count.
- Selected members' initials in overlapping circular avatars.
- A continue button.

Maintain the existing design and interaction pattern.

---

# 5. EXISTING BACKEND DEBATE IMPLEMENTATION

This is particularly important: the debate backend is already partially implemented.

Do not recreate it unnecessarily.

The existing debate controller includes:

### createSession

`POST /api/.../debates`

Responsibilities:

- Read validated topic, domains, experts, mode and argument limit.
- Validate domain IDs.
- Validate saved expert IDs.
- Ensure experts are active and belong to the current user or are built-in experts.
- Support temporary experts.
- Snapshot selected expert information.
- Create the debate session.
- Return the created session.

The session stores:

- Owner ID.
- Title.
- Topic.
- Domains.
- Council members.
- Mode.
- Argument limit.

### getSession

`GET /api/.../debates/:sessionId`

Responsibilities:

- Validate the session ID.
- Verify session ownership.
- Fetch the session.
- Fetch associated messages.
- Sort messages by sequence.
- Return session and messages.

### generateNextTurn

`POST /api/.../debates/:sessionId/next`

Responsibilities:

- Validate the session ID.
- Verify ownership.
- Reject completed or abandoned sessions.
- Retrieve existing messages.
- Calculate the number of expert turns.
- Enforce the argument limit.
- Select the next expert in council order.
- Build the conversation prompt.
- Construct the expert's system prompt using their persona.
- Call `generateResponse()`.
- Save the generated message.
- Update session status.
- Return the generated message.

### Existing debate routes

The router also provides:

- `GET /presets`
- `POST /`
- `GET /:sessionId`
- `POST /:sessionId/next`

Inspect the router mounting prefix before constructing frontend API URLs. Do not assume the prefix.

### Important existing backend considerations

Before expanding functionality, review these issues:

1. **Turn concurrency:** Two simultaneous requests could select the same expert or create duplicate sequences. Add appropriate protection.
2. **Message sequence:** Do not assume `messages.length + 1` remains safe under concurrent generation.
3. **Argument limits:** Clearly define whether the limit counts expert responses only or all discussion contributions. The existing implementation counts expert responses.
4. **User messages:** User contributions are not implemented in the supplied controller.
5. **Auto modes:** Automatic orchestration is not yet demonstrated in the supplied controller.
6. **Error handling:** Handle LLM provider failures without incorrectly advancing the debate.
7. **Session status:** Define a consistent lifecycle for newly created, active, paused, completed and abandoned sessions, according to actual schema capabilities.
8. **Retry behavior:** Prevent accidental duplicate messages when a request is retried.
9. **Authorization:** Verify ownership on every session operation.

Do not redesign the database or controllers before inspecting their existing schemas and middleware.

---

# 6. DEBATE WORKSPACE — CURRENT FRONTEND STATE

The current primary frontend component is:

`DebateWorkspace.jsx`

The component currently includes:

### Left sidebar

- AI Council branding.
- Theme toggle.
- Debate Panel navigation.
- Past Discussions navigation.
- New Session navigation.
- User profile.
- Logout.
- Collapsible sidebar.

### Top header

- Debate session number.
- Live indicator.
- Debate mode.
- Response limit.
- Session settings.
- Council member count.
- Conclude Debate placeholder.

### Centre discussion panel

- Council Discussion heading.
- Topic display.
- Replay Demo placeholder.
- Expert filter buttons.
- Empty discussion state.
- Selected council member list.
- Disabled message composer.
- Send button placeholder.

### Right whiteboard

- Whiteboard heading.
- Open Questions section.
- Resolved section.
- Empty states.
- Hide/show whiteboard functionality.

The whiteboard layout must remain consistent in light and dark themes.

### Existing frontend implementation issues

The following should be addressed while implementing functionality:

- `activeFilter` currently has no All button.
- Filtering is not yet connected to actual messages.
- The component relies on `location.state?.session`, which means refreshing the page may lose session information.
- The session should be retrieved using the URL `sessionId`.
- The current LIVE indicator should reflect the real session status.
- The Replay Demo and Conclude Debate buttons are placeholders.
- The message composer is disabled because user-message support is not yet implemented.

Preserve the existing layout, styling, spacing and overall design.

Do not redesign the workspace from scratch.

---

# 7. COMPLETE IMPLEMENTATION ROADMAP

Implement the application in the following phases.

Do not attempt to implement everything in one massive change.

Complete each phase, test it, and then proceed.

## PHASE 0 — CODEBASE AUDIT

Before coding:

1. Inspect the repository structure.
2. Read the package files.
3. Identify frontend and backend entry points.
4. Inspect existing API/Axios configuration.
5. Inspect React Router configuration.
6. Inspect TanStack Query configuration.
7. Inspect Zustand stores.
8. Inspect session, message, expert and domain schemas.
9. Inspect existing debate controllers and routes.
10. Inspect the LLM service and provider abstraction.
11. Inspect the current DebateWorkspace component.
12. Identify existing tests.

Produce a short report containing:

- Implemented functionality.
- Partially implemented functionality.
- Missing functionality.
- Existing bugs.
- Files that need modification.

Do not make large changes during the audit.

The repository is the source of truth. This handoff is context, not a replacement for inspecting actual code.

## PHASE 1 — COMPLETE THE DEBATE WORKSPACE UI

First finish the existing workspace using the current layout.

### 1.1 Session loading

Fetch session information using the `sessionId` route parameter.

Use TanStack Query for server state.

Requirements:

- Fetch session details.
- Fetch messages.
- Show loading state.
- Show error state.
- Handle invalid session IDs.
- Handle missing sessions.
- Support refreshing the page.
- Verify the user owns the session.

Do not depend on React Router navigation state for persistent session data.

### 1.2 Message display

Create a clean discussion timeline.

Every message should support:

- Speaker avatar or initials.
- Speaker name.
- Speaker role, where available.
- Message content.
- Timestamp.
- Message sequence.
- Appropriate visual distinction between expert and user messages.

Expert messages should be visually distinguishable without making every expert card unnecessarily large.

Use the existing council information to resolve speaker details.

Support long messages and readable formatting.

### 1.3 Message filtering

Add an All filter and individual expert filters.

Requirements:

- All displays every message.
- Selecting an expert displays that expert's messages.
- User messages can have their own filter if useful.
- Active filter styling must match the existing design.
- Filtering must not change the underlying conversation.

### 1.4 Message composer

Eventually support:

- Text input.
- Enter to send.
- Shift + Enter for a newline.
- Send button.
- Loading state.
- Disabled state while appropriate.
- Error feedback.

Do not enable sending until the corresponding backend functionality exists.

### 1.5 Empty and loading states

Create useful states for:

- Session loading.
- No messages.
- Debate generating.
- Debate completed.
- Debate paused.
- Generation failure.

Avoid unnecessary decorative animations.

## PHASE 2 — DEBATE ENGINE

The debate engine is the core of the application.

Build on the existing `generateNextTurn` implementation.

### 2.1 Turn management

Initially preserve the existing round-robin expert order.

Example:

Expert A → Expert B → Expert C → Expert D → Expert A.

Each expert should receive the conversation context necessary to respond meaningfully.

The expert should:

- Address the topic.
- Consider earlier arguments.
- Avoid repeating existing arguments.
- Challenge weak reasoning when appropriate.
- Contribute from their assigned perspective.
- Maintain their defined persona.
- Avoid pretending to be another expert.

### 2.2 Conversation context

Build a context containing:

- Topic.
- Relevant domains.
- Council members.
- Previous messages.
- Current expert.
- Debate instructions.

Avoid sending unlimited conversation history.

Plan a context-management strategy that preserves important earlier arguments when conversations become long.

Do not prematurely implement a complex summarization system if a straightforward context window is sufficient for the MVP.

### 2.3 Generation states

The UI should communicate:

- Which expert is expected to speak next.
- Which expert is currently generating.
- When generation has completed.
- When an error occurs.

Use a clear generating indicator.

### 2.4 Generation errors

If the provider fails:

- Do not save an incomplete message.
- Do not incorrectly advance the expert turn.
- Show an understandable error.
- Allow the user to retry.
- Prevent duplicate messages.

### 2.5 Debate completion

When the response limit is reached:

- Mark the session completed.
- Stop further automatic generation.
- Disable inappropriate controls.
- Allow the user to review the discussion.
- Allow final report generation.

Preserve the existing argument-limit behavior unless the user approves changing its definition.

## PHASE 3 — USER PARTICIPATION

Implement user messages.

This requires backend and frontend changes.

### Backend

Introduce a validated endpoint for adding a user message.

Requirements:

- Verify session ownership.
- Verify the session is active.
- Validate content.
- Save the message.
- Assign a unique sequence.
- Prevent invalid or duplicate submissions.
- Enforce sensible content-length limits.

Review how user messages interact with the existing argument-limit semantics.

### Frontend

Enable the message composer.

Support:

- Sending a message.
- Displaying it immediately or after server confirmation.
- Loading state.
- Error handling.
- Empty-message prevention.
- Scroll-to-latest behavior.

User messages should become part of the context for subsequent expert responses.

The system should never allow the frontend to impersonate an expert.

## PHASE 4 — THREE DEBATE MODES

Implement three interaction modes.

These are important product requirements.

### 4.1 Manual Mode

The debate progresses only when the user explicitly requests the next expert response.

Expected flow:

1. User creates the session.
2. The next expert is identified.
3. User clicks Continue.
4. One expert response is generated.
5. The system waits for the user.
6. User can contribute or request another response.

No automatic progression.

### 4.2 Auto Mode

The debate progresses automatically.

Expected flow:

1. User starts the debate.
2. The engine generates expert responses.
3. The next expert is selected.
4. Generation continues until the configured limit.
5. The debate is completed.

Provide controls to pause and resume.

Avoid implementing an uncontrolled frontend loop.

The backend should provide reliable turn-generation semantics, and the frontend should coordinate the requested automatic behavior.

### 4.3 Semi-auto Mode

The debate progresses automatically unless user intervention is needed.

Expected behavior:

- Experts continue taking turns automatically.
- The user can pause the debate.
- The user can submit a question or contribution.
- User intervention should be incorporated into subsequent responses.
- Automatic progression should resume according to clearly defined behavior.

The precise interaction rules should be finalized with the user before implementation if they are not already established in the codebase.

### 4.4 Mode consistency

The selected mode must be respected by both frontend and backend.

Do not rely only on hiding or showing buttons.

The backend must enforce valid operations.

---

## PHASE 5 — WHITEBOARD

The whiteboard is a central feature, not just a decorative sidebar.

It should collect important information from the discussion.

The initial categories are:

### 5.1 Open Questions

Questions raised during the discussion that have not been answered conclusively.

Each item should contain:

- Question.
- Short context.
- Source message or expert.
- Status.
- Creation time.

### 5.2 Resolved Questions

Questions that the council considers sufficiently answered.

Include the resolution and relevant discussion context.

### 5.3 Issues and Disagreements

Record:

- Important disagreements.
- Conflicting assumptions.
- Unresolved arguments.
- Points requiring further examination.

### 5.4 Agreements

Capture:

- Shared conclusions.
- Common ground.
- Points accepted by multiple experts.
- Areas of consensus.

### 5.5 Whiteboard interaction

The user should eventually be able to:

- View entries.
- Open an entry.
- Mark an entry resolved.
- Reopen an entry.
- Remove inappropriate entries if permitted.
- Review their source messages.

### 5.6 AI extraction

The debate engine should identify useful whiteboard items from expert and user messages.

Do not generate unnecessary whiteboard entries after every minor statement.

Prefer meaningful, concise entries.

Use structured validation for AI-generated whiteboard data.

The whiteboard should remain readable and synchronized with the debate.

---

## PHASE 6 — ADVANCED EXPERT INTERACTION

After the basic debate engine and whiteboard are stable, introduce advanced interaction.

### 6.1 Expert selection strategy

The existing round-robin mechanism is the initial implementation.

Later support:

- Round-robin.
- Dynamic expert selection.
- Mention-based selection.

### 6.2 Dynamic selection

The engine may select the most relevant next expert based on:

- The topic.
- Previous arguments.
- Outstanding questions.
- Areas requiring clarification.
- Relevant expertise.

Do not implement this before the basic round-robin system works reliably.

### 6.3 @Mentions

Allow the user to mention an expert.

For example:

`@Socrates What assumptions are we making here?`

The mentioned expert should receive priority according to the agreed turn-management rules.

### 6.4 Direct expert interaction

Consider allowing the user to ask an individual expert a question without losing the overall debate context.

Clarify whether this should be a normal turn, an interrupting turn, or a separate interaction.

---

## PHASE 7 — LISTEN MODE

Listen Mode should make the debate accessible as an audio experience.

This is a significant feature and should be implemented after the basic discussion experience works.

### 7.1 Overall playback

Support:

- Play.
- Pause.
- Resume.
- Stop.
- Playback progress.
- Moving between messages.
- Playback speed.

### 7.2 Sentence highlighting

While audio is playing:

- Highlight the current sentence.
- Keep the currently spoken message visible.
- Scroll to the active message when appropriate.

### 7.3 Word highlighting

The currently spoken word should receive more prominent highlighting.

Sentence and word highlighting should stay synchronized with playback.

### 7.4 Individual message playback

Each message should have its own Speak button.

The user should be able to start playback from any message.

### 7.5 Resume behavior

When paused, playback should resume from the exact position rather than restarting the message.

Investigate the most appropriate browser speech or audio implementation.

Do not promise word-level synchronization using a speech API that does not expose reliable word timing.

---

## PHASE 8 — PROVIDER AND MODEL MANAGEMENT

The application should support multiple LLM providers through a unified backend interface.

Intended providers:

- OpenRouter.
- Local `api-box` service.

The architecture should avoid coupling debate logic to individual providers.

### Requirements

- Centralized provider integration.
- Configurable models.
- Provider failure handling.
- Request timeouts.
- Retry policies where appropriate.
- Secure API-key handling.
- Consistent response format.
- Model availability checks where supported.

### Budget levels

Support four budget levels:

- Low.
- Medium.
- High.
- Extra.

These should influence model selection and/or generation budget.

Do not hardcode provider-specific logic throughout the debate controller.

Use the existing LLM service abstraction.

The existing `generateResponse()` function should be inspected before modifying provider architecture.

---

## PHASE 9 — REPORT GENERATION

Once a debate concludes, the user should be able to generate a structured report.

The report should contain:

1. Debate topic.
2. Participating experts.
3. Executive summary.
4. Main arguments.
5. Expert-specific perspectives.
6. Areas of agreement.
7. Areas of disagreement.
8. Unresolved questions.
9. Important evidence and assumptions.
10. Final conclusions.
11. Whiteboard summary.

The report should distinguish between:

- Actual agreement.
- Majority opinion.
- Individual expert positions.
- Unresolved disagreement.

Do not manufacture consensus.

The report should be accessible from completed debate sessions.

Consider export options such as Markdown or PDF after the report functionality is stable.

---

## PHASE 10 — TOOL REGISTRY

The longer-term architecture may support tools that experts can use during debates.

However:

**The tool registry must remain disabled by default.**

Do not give LLMs unrestricted access to tools.

Future implementation should support:

- Registered tools.
- Tool descriptions.
- Input schemas.
- Permission checks.
- Execution limits.
- Result validation.
- Logging.
- Explicit enablement.

Only implement this when the core application is stable.

---

## PHASE 11 — SESSION HISTORY AND MANAGEMENT

The user should be able to manage previous discussions.

Required functionality:

- List previous sessions.
- Open a previous session.
- Continue an eligible session.
- Review completed sessions.
- Display session status.
- Display topic and date.
- Display participating experts.
- Delete sessions if supported by the existing product design.
- Archive sessions if appropriate.

Past Discussions should connect to actual persisted sessions rather than static placeholders.

Refreshing or reopening a session must not lose its conversation.

---

# 8. DESIGN AND USER EXPERIENCE REQUIREMENTS

Preserving the original AI Council visual identity is important.

Do not introduce an entirely new design language.

## 8.1 General design

The interface should be:

- Clean.
- Modern.
- Professional.
- Minimal.
- Responsive.
- Comfortable for long discussions.

Use Tailwind CSS and Lucide icons consistently.

Avoid excessive gradients, large decorative elements, unnecessary shadows and excessive rounded containers.

## 8.2 Light and dark themes

Both themes must be supported.

Important requirement:

The whiteboard must have the same information architecture in both themes.

Do not let the light theme display a different or outdated sidebar.

Check text contrast, borders, backgrounds and interactive states in both themes.

## 8.3 Debate workspace layout

The intended desktop workspace has three main regions:

LEFT:
- Navigation.
- Debate Panel.
- Past Discussions.
- New Session.
- User profile.
- Logout.

CENTRE:
- Debate header.
- Topic.
- Expert filters.
- Discussion messages.
- Message composer.
- Debate controls.

RIGHT:
- Whiteboard.
- Open questions.
- Resolved items.
- Agreements.
- Issues and disagreements.

The right panel should be hideable.

On smaller screens, use an appropriate responsive layout rather than allowing the three columns to become unusably narrow.

## 8.4 Interaction consistency

Use consistent patterns across the application.

For example:

- Floating bottom summary/navigation on configuration and expert selection pages.
- Consistent buttons and modal design.
- Consistent loading and empty states.
- Consistent spacing.
- Consistent typography.
- Clear active states.

---

# 9. STATE MANAGEMENT RULES

Use the existing state-management approach.

### TanStack Query

Use for server-owned data:

- Current session.
- Messages.
- Expert lists.
- Domains.
- Previous sessions.
- Whiteboard data.
- Reports.

### Zustand

Keep for lightweight client/UI state, such as:

- Theme if already managed there.
- Sidebar state.
- UI preferences.
- Temporary interface selections where appropriate.

Do not store the entire server conversation in Zustand when TanStack Query already manages it.

Avoid maintaining duplicate copies of the same data.

### React component state

Use local component state for simple temporary UI interactions.

Do not create a global store for everything.

---

# 10. BACKEND DESIGN PRINCIPLES

Keep the backend straightforward.

Use the existing structure and conventions.

Responsibilities should remain clear:

- Routes: HTTP endpoint definitions.
- Controllers: Request handling and orchestration.
- Models: Database structure.
- Services: Reusable business and external-service logic.
- Middleware: Authentication, authorization, validation and error handling.

Use Zod to validate incoming user data.

Use Mongoose schemas to enforce persistent data structure.

Important backend requirements:

- Authentication.
- Ownership verification.
- Input validation.
- Safe error handling.
- Consistent API responses.
- Concurrency protection.
- Appropriate database indexes.
- Secure provider credentials.
- No unnecessary database queries.

Do not create a separate service for every small operation.

---

# 11. API AND REAL-TIME COMMUNICATION

The existing REST API should remain the starting point.

For normal operations use REST endpoints.

For long-running generation, evaluate Server-Sent Events (SSE).

The intended experience is to show expert responses as they arrive rather than making the interface feel frozen.

Before implementing streaming, decide whether the LLM provider abstraction can support streaming.

If streaming is unavailable, a normal request with a clear generating state is acceptable for the initial version.

Do not introduce WebSockets unless there is a real requirement.

### Important distinction

There are two separate concerns:

1. Generating an expert response.
2. Delivering the response to the browser.

Keep these concerns separate so that changing the delivery mechanism does not require rewriting debate logic.

---

# 12. SECURITY AND RELIABILITY

Security should be considered throughout development.

Requirements:

- Verify session ownership.
- Validate all request parameters.
- Validate user messages.
- Secure authentication cookies.
- Configure CORS correctly.
- Protect API keys.
- Prevent unauthorized expert impersonation.
- Prevent duplicate generation.
- Handle concurrent requests.
- Apply sensible rate limits.
- Avoid exposing stack traces to clients.
- Prevent unauthorized access to historical sessions.

Do not trust data supplied by the frontend for authorization or expert identity.

---

# 13. TESTING STRATEGY

Testing should happen continuously.

### Backend tests

Test:

- Session creation.
- Invalid domains.
- Invalid expert IDs.
- Unauthorized session access.
- Session retrieval.
- Expert selection order.
- Argument limits.
- Generation failures.
- Duplicate requests.
- User messages.
- Session completion.

### Frontend tests

Test:

- Session loading.
- Message rendering.
- Expert filtering.
- User message submission.
- Generation states.
- Manual mode.
- Auto mode.
- Semi-auto mode.
- Whiteboard interactions.
- Theme switching.
- Responsive behavior.

### End-to-end tests

Important user journey:

1. Register/login.
2. Configure a debate.
3. Select experts.
4. Create a session.
5. Open the debate workspace.
6. Generate expert responses.
7. Send a user message.
8. Pause/resume if appropriate.
9. Review whiteboard entries.
10. Complete the debate.
11. Generate a report.
12. Reopen the session from history.

---

# 14. IMPLEMENTATION ORDER AND PRIORITIES

Do not implement all features simultaneously.

Use this priority order.

| Priority | Feature | Importance |
|---|---|---|
| P0 | Repository audit and preservation | Critical |
| P1 | Session fetching and persistence | Critical |
| P2 | Actual message rendering | Critical |
| P3 | Expert filtering | High |
| P4 | Generate next expert turn | Critical |
| P5 | User messages | Critical |
| P6 | Manual mode | Critical |
| P7 | Auto and Semi-auto modes | High |
| P8 | Whiteboard functionality | High |
| P9 | Dynamic expert selection and mentions | Medium |
| P10 | Listen Mode | Medium |
| P11 | Provider/model management | High |
| P12 | Final reports | High |
| P13 | Session history improvements | High |
| P14 | Tool registry | Later |

The exact order can be adjusted if the existing implementation already contains some of these features.

---

# 15. CODING RULES — VERY IMPORTANT

The user strongly prefers simple and efficient code.

Follow these rules:

1. Inspect existing code before creating new files.
2. Reuse existing services, hooks and utilities.
3. Avoid unnecessary abstractions.
4. Do not add dependencies without a good reason.
5. Avoid redundant state.
6. Avoid excessive prop drilling where a simple alternative exists.
7. Do not create giant components that become difficult to maintain.
8. Do not split straightforward logic into multiple files without a reason.
9. Prefer readable conditional logic over unnecessarily clever code.
10. Avoid duplicate API calls.
11. Keep backend and frontend responsibilities clear.
12. Remove unused imports and variables.
13. Handle errors properly.
14. Use consistent naming.
15. Do not leave fake implementations presented as completed features.

### Code-change workflow

For every implementation task:

1. Identify the relevant files.
2. Read their current contents.
3. Understand existing dependencies.
4. Explain the proposed changes briefly.
5. Make the smallest reasonable change.
6. Run relevant tests or build checks.
7. Fix regressions.
8. Summarize what changed.

When modifying an existing file, preserve unrelated functionality.

Never replace an entire file simply to change a few lines unless the existing structure genuinely needs replacement.

---

# 16. HOW TO WORK WITH THE USER

The user wants to understand the application while developing it.

Therefore:

- Explain what is being implemented.
- Explain important technical decisions.
- Keep explanations practical.
- Avoid unnecessarily lengthy theoretical discussions.
- Point out actual problems rather than blindly agreeing.
- Ask before making significant architectural changes.
- Ask when a product behavior is genuinely ambiguous.
- Do not ask questions whose answers are already available in the codebase or previous decisions.
- Do not ask ten questions at once.
- When possible, make reasonable implementation decisions and explain them.

The user prefers implementing and understanding the project incrementally.

Do not dump hundreds of lines of code for an entire feature without first establishing its design and integration points.

---

# 17. IMMEDIATE NEXT TASK — CONTINUE FROM CURRENT STATE

The current working file is `DebateWorkspace.jsx`.

The user has completed the previously discussed UI cleanup and layout changes.

The supplied component already has:

- Collapsible left navigation.
- Theme toggle.
- Debate session header.
- Centre discussion area.
- Expert filter buttons.
- Placeholder message composer.
- Right whiteboard.
- Whiteboard visibility toggle.
- User profile and logout.

The backend already has:

- Session creation.
- Session retrieval.
- Next expert-turn generation.
- Expert persona prompt construction.
- Message persistence.
- Argument-limit enforcement.

### The next implementation task is:

**Connect the existing DebateWorkspace to the existing debate backend and display real session messages.**

Implement in this order:

1. Inspect the Axios instance and API service structure.
2. Inspect the debate route mounting prefix.
3. Inspect the session and message schemas.
4. Create or extend the existing debate API service.
5. Implement a session query using the URL session ID.
6. Remove dependence on navigation state for session persistence.
7. Render actual messages.
8. Implement All and individual expert filtering.
9. Add a Generate Next Turn button for Manual mode.
10. Connect it to the existing `/next` endpoint.
11. Invalidate/refetch session messages after generation.
12. Add loading and error states.
13. Verify that refreshing the page preserves the session.

Do not implement the entire Auto/Semi-auto system in this first step.

First make the existing backend and frontend work together.

---

# 18. IMPORTANT PRODUCT DECISIONS TO PRESERVE

- This is a multi-expert debate platform, not merely a chatbot with different avatars.
- Experts must have distinct personas and perspectives.
- The original AI Council design and user flow should be preserved.
- The workspace should use a three-column layout on desktop.
- The whiteboard belongs on the right side.
- The whiteboard must work in both themes.
- Manual, Auto and Semi-auto are distinct interaction modes.
- Listen Mode must support sentence and word highlighting.
- The system should eventually support dynamic selection and @mentions.
- Tool registry functionality is disabled by default.
- The codebase should remain maintainable and uncomplicated.

---

# 19. FIRST RESPONSE EXPECTED FROM THE NEW AI

Do not immediately start rewriting code.

First:

1. Acknowledge that you are continuing an existing project.
2. Inspect the repository.
3. Identify which parts of this handoff are already implemented.
4. Identify any discrepancies between the handoff and actual source code.
5. Report the current state briefly.
6. Confirm the next concrete implementation step.

Then begin with the immediate next task described in Section 17.

**Final instruction: Build on what exists. Preserve what works. Implement only what is needed. Keep the architecture understandable.**