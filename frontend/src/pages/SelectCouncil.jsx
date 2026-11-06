import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { getExperts, createExpert } from "../services/expert";
import ExpertForm from "../components/council/ExpertForm";
import { getDomains } from "../services/domain";
import { suggestExperts } from "../services/ai";
import ExpertCard from "../components/council/ExpertCard";
export default function SelectCouncil() {
  const location = useLocation();
  const navigate = useNavigate();

  const { topic, domains = [] } = location.state || {};

  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedExperts, setSelectedExperts] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(domains);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const domainIds = selectedDomains.map((domain) =>
    typeof domain === "string" ? domain : domain._id,
  );
  const suggestExpertsMutation = useMutation({
    mutationFn: () => suggestExperts(topic, domainIds),
    onSuccess: (result) => {
      setSelectedExperts((current) =>
        current.filter((expert) => !expert.isTemporary),
      );
      setAiRecommendations(result);
    },
  });
  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  const recommendedExpertsQuery = useQuery({
    queryKey: ["recommendedExperts"],
    queryFn: () => getExperts(),
    enabled: !!aiRecommendations,
  });

  const recommendedExperts = recommendedExpertsQuery.data || [];
  const recommendedIds = aiRecommendations?.existingExpertIds || [];

  const isRecommended = (id) => recommendedIds.includes(id);

  const addProposedExpert = (expert, index) => {
    const proposedExpert = {
      ...expert,
      _id: `temporary-${index}`,
      isTemporary: true,
      expertise: expert.expertise
        .map((id) => availableDomains.find((domain) => domain._id === id))
        .filter(Boolean),
    };

    setSelectedExperts((current) => {
      if (current.length >= 12) return current;
      if (current.some((item) => item._id === proposedExpert._id)) {
        return current;
      }

      return [...current, proposedExpert];
    });
  };
  const {
    data: experts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["experts", type, search, domainIds],
    queryFn: () =>
      getExperts({
        type,
        search: search || undefined,
        domains: domainIds.length ? domainIds.join(",") : undefined,
      }),
  });
  const toggleExpert = (expert) => {
    setSelectedExperts((current) => {
      const exists = current.some((item) => item._id === expert._id);

      if (exists) {
        return current.filter((item) => item._id !== expert._id);
      }

      if (current.length >= 12) return current;

      return [...current, expert];
    });
  };

  const isSelected = (id) =>
    selectedExperts.some((expert) => expert._id === id);

  const handleContinue = () => {
    navigate("/debate/new", {
      state: {
        topic,
        domains: selectedDomains,
        experts: selectedExperts,
      },
    });
  };
  const queryClient = useQueryClient();
  const [showExpertForm, setShowExpertForm] = useState(false);

  const { data: availableDomains = [] } = useQuery({
    queryKey: ["domains"],
    queryFn: () => getDomains(),
  });

  const createExpertMutation = useMutation({
    mutationFn: createExpert,
    onSuccess: async (expert) => {
      await queryClient.invalidateQueries({ queryKey: ["experts"] });

      setSelectedExperts((current) =>
        current.length < 12 ? [...current, expert] : current,
      );

      setShowExpertForm(false);
    },
  });
  if (!topic) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">No debate topic found.</p>
        <button
          onClick={() => navigate("/configure")}
          className="mt-4 text-link"
        >
          Configure debate
        </button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 pt-6 pb-28">
      <header>
        <button
          onClick={() => navigate("/configure")}
          className="mb-3 text-sm text-text-secondary hover:text-text-primary"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold">Select Council Members</h1>
        <p className="mt-2 text-text-secondary">{topic}</p>
      </header>

 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  {/* Expert filters */}
  <div className="flex flex-wrap gap-2">
    {["all", "ai", "human"].map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => setType(item)}
        className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
          type === item
            ? "border-brand bg-brand/10 text-text-primary"
            : "border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
        }`}
      >
        {item === "all"
          ? "All Experts"
          : item === "ai"
            ? "AI Experts"
            : "Human-like"}
      </button>
    ))}
  </div>

  {/* Council actions */}
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
    <button
      type="button"
      onClick={() => setShowExpertForm(true)}
      className="rounded-lg border border-brand px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
    >
      + Create Expert
    </button>

    <button
      type="button"
      onClick={() => suggestExpertsMutation.mutate()}
      disabled={suggestExpertsMutation.isPending || isLoading}
      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {suggestExpertsMutation.isPending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Assembling...
        </>
      ) : (
        "✨ Assemble Council with AI"
      )}
    </button>
  </div>
</div>

{/* AI assembly error */}
{suggestExpertsMutation.isError && (
  <div
    role="alert"
    className="flex min-w-0 items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
  >
    <span className="shrink-0">⚠</span>
    <p className="min-w-0 break-words">
      {suggestExpertsMutation.error?.response?.data?.message ||
        suggestExpertsMutation.error?.message ||
        "Unable to assemble the council. Please try again."}
    </p>
  </div>
)}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search experts..."
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
      />
      {selectedDomains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDomains.map((domain) => {
            const id = typeof domain === "string" ? domain : domain._id;
            const name = typeof domain === "string" ? domain : domain.name;

            return (
              <button
                key={id}
                onClick={() =>
                  setSelectedDomains((current) =>
                    current.filter(
                      (item) =>
                        (typeof item === "string" ? item : item._id) !== id,
                    ),
                  )
                }
                className="rounded-full border border-brand bg-brand/10 px-3 py-1 text-sm"
              >
                {name} ×
              </button>
            );
          })}
        </div>
      )}
      {isLoading && <p>Loading experts...</p>}

      {error && (
        <p className="text-red-400">
          Failed to load experts. Please try again.
        </p>
      )}

      {!isLoading && !error && experts.length === 0 && (
        <p className="text-text-secondary">No experts found.</p>
      )}
      {showExpertForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowExpertForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Custom Expert</h2>

              <button
                type="button"
                onClick={() => setShowExpertForm(false)}
                className="rounded-lg px-2 py-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <ExpertForm
              domains={availableDomains}
              initialExpertise={domainIds}
              onCancel={() => setShowExpertForm(false)}
              isPending={createExpertMutation.isPending}
              onSubmit={(data) => createExpertMutation.mutate(data)}
            />

            {createExpertMutation.isError && (
              <p className="mt-3 text-sm text-red-500">
                {createExpertMutation.error?.response?.data?.message ||
                  "Failed to create expert."}
              </p>
            )}
          </div>
        </div>
      )}
      {aiRecommendations && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">AI Recommended Experts</h2>
            <p className="text-sm text-text-secondary">
              These existing experts were selected as suitable for your topic.
            </p>
          </div>

          {aiRecommendations.existingExpertIds.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No existing experts were recommended.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {aiRecommendations.existingExpertIds.map((id) => {
                const expert = recommendedExperts.find(
                  (item) => item._id === id,
                );
                if (!expert) return null;

                return (
                  <button
                    key={id}
                    onClick={() => toggleExpert(expert)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      isSelected(id)
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-surface hover:border-brand"
                    }`}
                  >
                    {expert.name}
                    {isSelected(id) ? " ✓" : " + Add"}
                  </button>
                );
              })}
            </div>
          )}

          {aiRecommendations?.newExperts?.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Proposed New Experts</h2>
                <p className="text-sm text-text-secondary">
                  These experts fill gaps in the existing council. They are
                  temporary and won't be saved to your reusable experts.
                </p>
              </div>

              <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {aiRecommendations.newExperts.map((expert, index) => {
                  const temporaryId = `temporary-${index}`;
                  const selected = isSelected(temporaryId);

                  return (
                    <ExpertCard
                      key={`temporary-${index}`}
                      expert={expert}
                      domains={availableDomains}
                      temporary
                      selected={isSelected(`temporary-${index}`)}
                      onToggle={() => {
                        const id = `temporary-${index}`;

                        if (isSelected(id)) {
                          setSelectedExperts((current) =>
                            current.filter((item) => item._id !== id),
                          );
                        } else {
                          addProposedExpert(expert, index);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </section>
      )}
      <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {experts.map((expert) => (
          <ExpertCard
            key={expert._id}
            expert={expert}
            domains={availableDomains}
            selected={isSelected(expert._id)}
            recommended={isRecommended(expert._id)}
            onToggle={() => toggleExpert(expert)}
          />
        ))}
      </div>

      <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-lg">
        <div className="flex items-center justify-between gap-4">
          {/* Selected members */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Overlapping member avatars */}
            <div className="flex items-center pl-2">
              {selectedExperts.map((expert, index) => {
                const expertise = (expert.expertise || [])
                  .map((domain) =>
                    typeof domain === "string"
                      ? availableDomains.find((item) => item._id === domain)
                          ?.name
                      : domain.name,
                  )
                  .filter(Boolean);

                return (
                  <div
                    key={expert._id}
                    className="group relative -ml-2"
                    style={{ zIndex: selectedExperts.length - index }}
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-surface-hover text-xs font-semibold text-text-primary transition-transform group-hover:scale-110">
                      {getInitials(expert.name)}
                    </div>

                    {/* Hover details */}
                    <div className="invisible absolute bottom-full left-1/2 z-50 mb-3 w-56 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="rounded-xl border border-border bg-surface p-3 shadow-xl">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {expert.name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {expert.role}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpert(expert)}
                            title="Remove member"
                            className="shrink-0 rounded-md px-1.5 text-text-secondary hover:bg-red-500/10 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {expertise.map((name) => (
                            <span
                              key={name}
                              className="rounded-full bg-surface-hover px-2 py-1 text-xs text-text-secondary"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0">
              <p className="text-sm font-semibold">
                {selectedExperts.length}/12
                <span className="ml-1 font-normal text-text-secondary">
                  selected
                </span>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <button
            disabled={selectedExperts.length < 2}
            onClick={handleContinue}
            className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
