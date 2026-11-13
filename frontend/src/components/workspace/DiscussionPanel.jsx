import { MessageSquare, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
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
}) {
  const [draft, setDraft] = useState("");
const expertTurnCount = messages.filter(
  message => message.speakerType === 'expert',
).length

const generatingExpert = council.length
  ? council[expertTurnCount % council.length]
  : null

const showGeneratingSkeleton = isGenerating && (
  activeFilter === 'All' || activeFilter === generatingExpert?.ref
)
  const handleSubmit = (event) => {
    event.preventDefault();
    const content = draft.trim();

    if (!content || !canSendMessage || isSending) return;

    onSendMessage(content, () => setDraft(""));
   
 
  };
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-dotted border-border bg-surface shadow-sm">
      <div className="border-b border-border px-4 py-4 lg:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold">Council Discussion</h2>
            <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-text-secondary">
              Topic: {topic}
            </p>
          </div>
          {canGenerateNextTurn && (
            <button
              type="button"
              onClick={onGenerateNextTurn}
              disabled={isGenerating || sessionQuery.isLoading}
              className="rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Next Turn"}
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["All", ...council.map((member) => member.ref)].map((filter) => {
            const label =
              filter === "All"
                ? "All participants"
                : council.find((member) => member.ref === filter)?.name;
            return (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${activeFilter === filter ? "border-brand/50 bg-brand/10 text-brand" : "border-border bg-surface-hover text-text-secondary hover:text-text-primary"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {generationError && (
          <p
            role="alert"
            className="mt-3 text-xs text-red-600 dark:text-red-400"
          >
            {generationError.response?.data?.message ||
              "Could not generate the next turn. Please try again."}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-app px-4 py-5 lg:px-5">
        {sessionQuery.isLoading ? (
          <p className="m-auto text-sm text-text-secondary">
            Loading debate...
          </p>
        ) : sessionQuery.isError ? (
          <div className="m-auto max-w-md text-center">
            <h3 className="text-sm font-semibold">
              Could not load this debate
            </h3>
            <p
              role="alert"
              className="mt-2 text-xs text-red-600 dark:text-red-400"
            >
              {sessionQuery.error?.response?.data?.message ||
                "Please check your connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => sessionQuery.refetch()}
              disabled={sessionQuery.isFetching}
              className="mt-4 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface disabled:opacity-50"
            >
              {sessionQuery.isFetching ? "Retrying..." : "Retry"}
            </button>
          </div>
        ) : visibleMessages.length === 0 && !showGeneratingSkeleton  ? (
          <div className="m-auto max-w-md text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface text-text-secondary">
              <MessageSquare size={21} />
            </span>
            <h3 className="mt-4 text-sm font-semibold">
              {messages.length === 0
                ? "Your discussion is ready"
                : "No messages from this participant"}
            </h3>
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              {messages.length === 0
                ? "Generate the next turn to start the discussion."
                : "Choose All participants to view the full discussion."}
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {visibleMessages.map((message) => {
              const speaker = council.find(
                (member) => member.ref === message.speakerRef,
              );
              const timestamp = formatTimestamp(message.createdAt);
              return (
                <article
                  key={message._id || message.sequence}
                  className={`rounded-lg border p-4 ${
                    message.speakerType === "user"
                      ? "ml-8 border-brand/30 bg-brand/5"
                      : "mr-8 border-border bg-surface"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-xs font-semibold">
                      {message.speakerName}
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      {message.speakerType === "user"
                        ? "You"
                        : speaker?.role || message.speakerType}
                    </span>
                    <span className="ml-auto text-[10px] text-text-secondary">
                      Turn {message.sequence}
                      {timestamp ? ` · ${timestamp}` : ""}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {message.content}
                  </p>
                </article>
              );
            })}
            
          {showGeneratingSkeleton && (
  <ExpertMessageSkeleton expertName={generatingExpert?.name} />
)}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-surface p-3 lg:p-4"
      >
        <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-app px-3 py-2 text-[10px] text-text-secondary">
          <ShieldCheck size={13} />
          {canSendMessage
            ? "Enter to send · Shift + Enter for a new line."
            : sessionStatus === "completed" || sessionStatus === "abandoned"
              ? "This debate is closed."
              : "Generate the first expert turn before contributing."}
        </div>

        {sendError && (
          <p
            role="alert"
            className="mb-2 text-xs text-red-600 dark:text-red-400"
          >
            {sendError.response?.data?.message ||
              "Could not send your message. Please try again."}
          </p>
        )}

        <div className="flex items-center gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={!canSendMessage || isSending}
            maxLength={4000}
            rows={2}
            placeholder="Contribute to the discussion..."
            className="min-w-0 flex-1 resize-y rounded-md border border-border bg-app px-3 py-2.5 text-sm outline-none placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!canSendMessage || isSending || !draft.trim()}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send"} <Send size={14} />
          </button>
        </div>
      </form>
    </main>
  );
}
function ExpertMessageSkeleton({ expertName }) {
  return (
    <article
      role="status"
      aria-live="polite"
      aria-label={`${expertName || "Expert"} is generating a response`}
      className="mr-8 animate-pulse rounded-lg border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-24 rounded bg-surface-hover" />
        <span className="h-2.5 w-16 rounded bg-surface-hover" />
        <span className="ml-auto h-2.5 w-12 rounded bg-surface-hover" />
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
