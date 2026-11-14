import { 
  MessageSquare, ShieldCheck, X, Plus, Mic, 
  ChevronUp, ArrowUp, Info, Sparkles, Play, Pause 
} from "lucide-react";
import { useState, useRef, useLayoutEffect } from "react";

export default function DiscussionPanel({
  topic,
  council,
  activeFilter,
  onFilterChange,
  canGenerateNextTurn,
  onGenerateNextTurn,
  isGenerating,
  generationError,
  sessionQuery,
  messages,
  visibleMessages,
  formatTimestamp,
  canSendMessage,
  sessionStatus,
  onSendMessage,
  isSending,
  sendError,
  canRunAuto,
  autoRunning,
  autoPauseRequested,
  onStartAuto,
  onPauseAuto,
  sessionMode,
  sessionArgumentLimit,
expertTurnCount,
canChangeMode,
isModeChangePending,
modeChangeError,
onChangeMode,
}) {
const [draft, setDraft] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const [dismissedHint, setDismissedHint] = useState(null);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const textareaRef = useRef(null);
  const [pendingMode, setPendingMode] = useState(null)
const [modeLimitDraft, setModeLimitDraft] = useState(10)
  // const expertTurnCount = messages.filter(
  //   (message) => message.speakerType === "expert",
  // ).length;

  const generatingExpert = council.length
    ? council[expertTurnCount % council.length]
    : null;

  const showGeneratingSkeleton =
    isGenerating &&
    (activeFilter === "All" || activeFilter === generatingExpert?.ref);

useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (!draft) {
      setIsMultiline(false);
      el.style.height = "24px";
      return;
    }

    // Measure height synchronously before browser paint
    el.style.height = "0px";
    const scrollHeight = el.scrollHeight;

    // Switch to full-width top row once text wraps past 1 line (> 28px) or has a newline
    if (!isMultiline && (draft.includes("\n") || scrollHeight > 28)) {
      setIsMultiline(true);
      return; // Next synchronous pass will measure height at full width
    }

    if (isMultiline && !draft.includes("\n") && draft.length < 35) {
      setIsMultiline(false);
      return;
    }

    el.style.height = `${Math.min(Math.max(scrollHeight, 24), 200)}px`;
  }, [draft, isMultiline]);
  const handleSubmit = (event) => {
    event.preventDefault();
    const content = draft.trim();

    if (!content || !canSendMessage || isSending) return;

    onSendMessage(content, () => {
      setDraft("");
      setIsMultiline(false);
      if (textareaRef.current) textareaRef.current.style.height = "24px";
    });
  };

  const currentHint = autoRunning
    ? 'Pause Auto mode before sending a message.'
    : canSendMessage
      ? 'Enter to send · Shift + Enter for a new line.'
      : sessionStatus === 'completed' || sessionStatus === 'abandoned'
        ? 'This debate is closed.'
        : 'Generate the first expert turn before contributing.';

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-dotted border-border bg-surface shadow-sm relative">
      
      {/* Ultra-Thin Header Area */}
      <div className="border-b border-border px-3 py-2 shrink-0 flex items-center gap-3">
        
        {/* Hoverable Info Icon */}
        <div className="relative group flex items-center shrink-0">
          <button type="button" className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors">
            <Info size={16} />
          </button>
          
          {/* Tooltip containing the removed header info */}
          <div className="absolute top-full left-0 mt-2 hidden w-72 rounded-xl border border-border bg-surface p-4 shadow-xl group-hover:block z-50">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Topic</h4>
            <p className="mt-1 mb-3 text-sm leading-relaxed">{topic}</p>
            
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Debate Mode</h4>
            <p className="mt-1 text-sm capitalize">{sessionMode?.replace('_', ' ') || 'Manual'}</p>
          </div>
        </div>

        <div className="w-px h-5 bg-border shrink-0"></div>

        {/* Scrollable Filter Bar (Horizontal scrolling keeps the header thin) */}
        <div className="flex flex-nowrap overflow-x-auto scrollbar-thin items-center gap-1.5 pr-2">
          {["All", ...council.map((member) => member.ref)].map((filter) => {
            const label =
              filter === "All"
                ? "All participants"
                : council.find((member) => member.ref === filter)?.name;
            return (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                  activeFilter === filter 
                    ? "border-brand/50 bg-brand/10 text-brand" 
                    : "border-border bg-surface-hover text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-app px-4 py-5 lg:px-5 pb-36 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {generationError && (
          <p role="alert" className="mb-4 text-center text-xs text-red-600 dark:text-red-400">
            {generationError.response?.data?.message || "Could not generate the next turn. Please try again."}
          </p>
        )}
        
        {sessionQuery.isLoading ? (
          <p className="m-auto text-sm text-text-secondary">Loading debate...</p>
        ) : sessionQuery.isError ? (
          <div className="m-auto max-w-md text-center">
            <h3 className="text-sm font-semibold">Could not load this debate</h3>
            <button
              type="button"
              onClick={() => sessionQuery.refetch()}
              className="mt-4 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface"
            >
              Retry
            </button>
          </div>
        ) : visibleMessages.length === 0 && !showGeneratingSkeleton ? (
          <div className="m-auto max-w-md text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface text-text-secondary">
              <MessageSquare size={21} />
            </span>
            <h3 className="mt-4 text-sm font-semibold">Your discussion is ready</h3>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {visibleMessages.map((message) => {
              const speaker = council.find((member) => member.ref === message.speakerRef);
              return (
                <article
                  key={message._id || message.sequence}
                  className={`rounded-2xl p-4 max-w-[85%] sm:max-w-[75%] ${
                    message.speakerType === "user"
                      ? "self-end bg-brand/10 text-text-primary border border-brand/20 rounded-br-sm"
                      : "self-start bg-surface border border-border rounded-bl-sm"
                  }`}
                >
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{message.speakerName}</span>
                    <span className="text-[10px] text-text-secondary">Turn {message.sequence}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                </article>
              );
            })}
            {showGeneratingSkeleton && <ExpertMessageSkeleton expertName={generatingExpert?.name} />}
          </div>
        )}
      </div>

      {/* Floating Controls Container */}
      <div className="absolute bottom-4 left-0 w-full px-4 lg:px-8 flex flex-col items-center justify-end pointer-events-none">
        
        {/* Hint Box */}
        {currentHint !== dismissedHint && (
          <div className="mb-3 flex max-w-max items-center justify-between gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[10px] text-text-secondary shadow-sm pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="shrink-0" />
              <span>{currentHint}</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedHint(currentHint)}
              className="shrink-0 rounded-full p-0.5 hover:bg-surface-hover hover:text-text-primary"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex w-full max-w-4xl items-end gap-3">
          
          {/* Left Island: Circular Action Buttons */}
          <div className="flex flex-col  gap-2 shrink-0  pointer-events-auto">
            {canGenerateNextTurn && (
              <button
                type="button"
                onClick={onGenerateNextTurn}
                disabled={isGenerating || sessionQuery.isLoading}
                title="Generate Next Turn"
                className="flex h-13 w-13 items-center justify-center rounded-full bg-brand text-white shadow-md hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <Sparkles size={20} className={isGenerating ? "animate-pulse" : ""} />
              </button>
            )}
            
            {canRunAuto && (
              <button
                type="button"
                onClick={autoRunning ? onPauseAuto : onStartAuto}
                disabled={isSending || (!autoRunning && isGenerating)}
                title={autoRunning ? "Pause Auto Debate" : "Start Auto Debate"}
                className={`flex h-13 w-13  pr-1 items-center justify-center rounded-full shadow-md transition-all ${
                  autoRunning 
                    ? "bg-surface border border-border text-brand hover:bg-surface-hover" 
                    : "bg-brand text-white hover:bg-brand-hover"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {autoPauseRequested ? (
                  <span className="text-[10px] font-bold">...</span>
                ) : autoRunning ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} className="ml-1" />
                )}
              </button>
            )}
          </div>

        {/* Right Island: Adaptive Input Form */}
          {/* Right Island: Adaptive Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-wrap items-center rounded-[28px] bg-surface border border-border shadow-md focus-within:ring-1 focus-within:ring-brand/50 transition-colors pointer-events-auto px-2.5 py-1.5"
          >
            {/* Left (+) Button */}
            <button
              type="button"
              title="Upload Media (Coming soon)"
              className="order-1 shrink-0 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
            >
              <Plus size={22} />
            </button>

            {/* Adaptive Textarea */}
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              disabled={!canSendMessage || isSending}
              rows={1}
              placeholder="Contribute to the discussion..."
              className={`resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-70 max-h-[200px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                isMultiline
                  ? "order-first w-full basis-full px-3 pt-2 pb-1 mb-1"
                  : "order-2 flex-1 min-w-0 px-2 my-1"
              }`}
              style={{ height: "24px" }}
            />

            {/* Right Controls */}
            <div className="order-3 ml-auto flex shrink-0 items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModeMenu(!showModeMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover rounded-full transition-all"
                >
                  <span className="capitalize">
                    {sessionMode?.replace("_", " ") || "Manual"}
                  </span>
                  <ChevronUp
                    size={14}
                    className={`transition-transform ${
                      showModeMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showModeMenu && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl flex flex-col gap-1 z-50">
                    <div className="px-3 py-2 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                      AI Model
                    </div>
                    <button
                      type="button"
                      className="flex flex-col items-start w-full rounded-xl px-3 py-2 hover:bg-surface-hover text-left"
                    >
                      <span className="text-sm">Local Model</span>
                      <span className="text-xs text-text-secondary">api-box</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex flex-col items-start w-full rounded-xl px-3 py-2 text-left opacity-50 cursor-not-allowed"
                    >
                      <span className="text-sm">OpenRouter</span>
                      <span className="text-xs text-text-secondary">
                        Coming soon
                      </span>
                    </button>

                    <div className="my-1 border-t border-border"></div>

                    <div className="px-3 py-2 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                      Debate Mode
                    </div>
                   {['manual', 'auto'].map(mode => {
  const isSelected = sessionMode === mode

  const selectMode = () => {
    if (!canChangeMode || isModeChangePending) return

    if (mode === 'auto' && sessionMode !== 'auto') {
      setModeLimitDraft(
        Math.max(sessionArgumentLimit || 10, expertTurnCount + 1),
      )
      setPendingMode('auto')
      return
    }

    if (mode !== sessionMode) {
      onChangeMode(mode, null, () => {
        setPendingMode(null)
        setShowModeMenu(false)
      })
      return
    }

    setShowModeMenu(false)
  }

  return (
    <button
      key={mode}
      type="button"
      disabled={!canChangeMode || isModeChangePending}
      aria-pressed={isSelected}
      onClick={selectMode}
      className={`w-full rounded-xl px-3 py-2 text-left text-sm capitalize ${
        isSelected
          ? 'bg-brand/10 text-brand'
          : 'hover:bg-surface-hover'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {mode.replace('_', ' ')}
    </button>
  )
})}{pendingMode === 'auto' && (
  <div className="mt-2 border-t border-border px-3 pt-3">
    <label htmlFor="modeArgumentLimit" className="text-xs font-medium">
      Expert response limit
    </label>

    <input
      id="modeArgumentLimit"
      type="number"
      min={Math.max(1, expertTurnCount + 1)}
      max={100}
      value={modeLimitDraft}
      onChange={event => setModeLimitDraft(Number(event.target.value))}
      className="mt-2 w-full rounded-lg border border-border bg-app px-3 py-2 text-sm"
    />

    {modeChangeError && (
      <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
        {modeChangeError.response?.data?.message ||
          'Could not change the debate mode.'}
      </p>
    )}

    <div className="mt-3 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setPendingMode(null)}
        className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover"
      >
        Cancel
      </button>

      <button
        type="button"
        disabled={
          isModeChangePending ||
          modeLimitDraft <= expertTurnCount ||
          modeLimitDraft > 100
        }
        onClick={() => onChangeMode('auto', modeLimitDraft, () => {
          setPendingMode(null)
          setShowModeMenu(false)
        })}
        className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {isModeChangePending ? 'Saving...' : 'Switch to Auto'}
      </button>
    </div>
  </div>
)}
                  </div>
                )}
              </div>

              <button
                type="button"
                title="Voice Input (Coming soon)"
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
              >
                <Mic size={20} />
              </button>

              {draft.trim() && (
                <button
                  type="submit"
                  disabled={!canSendMessage || isSending}
                  className="ml-1 p-2 text-white bg-brand rounded-full hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 transition-all shrink-0"
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function ExpertMessageSkeleton({ expertName }) {
  return (
    <article
      role="status"
      aria-live="polite"
      aria-label={`${expertName || "Expert"} is generating a response`}
      className="self-start w-full max-w-[85%] sm:max-w-[75%] animate-pulse rounded-2xl border border-border bg-surface p-4 rounded-bl-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-24 rounded bg-surface-hover" />
        <span className="h-2.5 w-16 rounded bg-surface-hover" />
      </div>
      <div className="space-y-2">
        <span className="block h-3 w-full rounded bg-surface-hover" />
        <span className="block h-3 w-5/6 rounded bg-surface-hover" />
        <span className="block h-3 w-2/3 rounded bg-surface-hover" />
      </div>
      <p className="mt-3 text-[10px] text-text-secondary">
        {expertName || "Expert"} is thinking…
      </p>
    </article>
  );
}