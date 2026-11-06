
export default function ExpertCard({
  expert,
  domains = [],
  selected = false,
  temporary = false,
  recommended = false,
  onToggle,
}) {
  const expertise = (expert.expertise || [])
    .map((item) =>
      typeof item === "string"
        ? domains.find((domain) => domain._id === item)
        : item,
    )
    .filter(Boolean);

  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        temporary
          ? "border-dashed border-brand/60 hover:border-brand hover:shadow-brand/10"
          : "border-border hover:border-brand/60"
      } ${selected ? "ring-1 ring-brand/40" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text-primary">
            {expert.name}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">{expert.role}</p>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <span className="rounded-md bg-surface-hover px-2 py-1 text-xs text-text-secondary">
            {expert.isHumanLike ? "Human-like" : "AI"}
          </span>

          {temporary ? (
            <span className="rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
              AI Proposed
            </span>
          ) : recommended ? (
            <span className="rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
              Recommended
            </span>
          ) : null}
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-text-secondary">
        {expert.description}
      </p>

      {/* Human-like details */}
      {expert.isHumanLike && (
        <div className="mt-4 space-y-2 rounded-lg bg-surface-hover/50 p-3 text-sm">
          <p>
            <span className="text-text-secondary">Inspired by:</span>{" "}
            <span className="font-medium text-text-primary">
              {expert.inspiredBy || "Original character"}
            </span>
          </p>

          {expert.characterTraits?.length > 0 && (
            <p>
              <span className="text-text-secondary">Traits:</span>{" "}
              <span className="text-text-primary">
                {expert.characterTraits.join(", ")}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Expertise */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
          Expertise
        </p>

        <div className="flex flex-wrap gap-2">
          {expertise.length > 0 ? (
            expertise.map((domain) => (
              <span
                key={domain._id}
                className="rounded-full bg-surface-hover px-2.5 py-1 text-xs text-text-secondary"
              >
                {domain.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-text-secondary">
              No expertise specified
            </span>
          )}
        </div>
      </div>

      {/* Action stays at the bottom */}
  <div className="mt-auto pt-5">
  <button
    type="button"
    onClick={onToggle}
    className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      selected
        ? "border border-brand bg-brand/10 text-brand hover:bg-brand/15"
        : "bg-brand text-white hover:bg-brand-hover"
    }`}
  >
    {selected ? "✓ Added to Council" : "+ Add to Council"}
  </button>
</div>
    </article>
  );
}
