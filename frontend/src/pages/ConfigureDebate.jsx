import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { getDomains } from "../services/domain";
import { getDebatePresets } from "../services/debate";
import { useMutation } from "@tanstack/react-query";
import { suggestDomains } from "../services/ai";
function ConfigureDebate() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [suggestedDomains, setSuggestedDomains] = useState([]);
  const domainsQuery = useQuery({
    queryKey: ["domains", search],
    queryFn: () => getDomains(search),
  });
  const suggestDomainsMutation = useMutation({
    mutationFn: suggestDomains,
    onSuccess: (suggestions) => {
      setSuggestedDomains(suggestions);
    },
  });
  const presetsQuery = useQuery({
    queryKey: ["debatePresets"],
    queryFn: getDebatePresets,
  });

  const domains = domainsQuery.data || [];
  const presets = presetsQuery.data || [];

  const toggleDomain = (domain) => {
    setSelectedDomains((current) =>
      current.some((item) => item._id === domain._id)
        ? current.filter((item) => item._id !== domain._id)
        : [...current, domain],
    );
  };

  const continueToCouncil = () => {
    if (!topic.trim()) return;

    navigate("/select-council", {
      state: {
        topic: topic.trim(),
        domains: selectedDomains,
      },
    });
  };

  return (
  <div className="min-h-screen bg-app px-4 pt-10 pb-28 text-text-primary">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/dashboard"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-10 mt-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Configure Your Debate
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Choose a topic and explore it from multiple perspectives.
          </p>
        </div>

        {/* Topic */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider">
              01. DEBATE TOPIC
            </h2>
          </div>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What would you like the council to debate?"
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-border bg-surface p-4 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand"
          />

          <p className="mt-2 text-right text-xs text-text-secondary">
            {topic.length}/500
          </p>
        </section>

        {/* Preset topics */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold tracking-wider">
            OR CHOOSE A PRESET
          </h2>

          {presetsQuery.isPending ? (
            <p className="text-sm text-text-secondary">Loading topics...</p>
          ) : presetsQuery.isError ? (
            <p className="text-sm text-red-400">
              Unable to load preset topics.
            </p>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset._id}
                  onClick={() => setTopic(preset.title)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                    topic === preset.title
                      ? "border-brand bg-brand/10"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    {preset.title}
                    {topic === preset.title && (
                      <span className="text-brand">✓</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Domains */}
        <section className="mb-10">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider">
              02. RELATED DOMAINS
            </h2>
            <span className="rounded-full border border-border px-2 py-1 text-xs text-text-secondary">
              Optional
            </span>
          </div>

          <p className="mb-4 text-sm text-text-secondary">
            Select multiple fields to explore your topic from different angles.
            Leave empty if you want AI to suggest relevant domains later.
          </p>

          {/* Selected domains */}
          {selectedDomains.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedDomains.map((domain) => (
                <button
                  key={domain._id}
                  onClick={() => toggleDomain(domain)}
                  className="flex items-center gap-2 rounded-full border border-brand bg-brand/10 px-3 py-1.5 text-sm text-text-primary"
                >
                  {domain.name}
                  <span className="text-text-secondary">×</span>
                </button>
              ))}
            </div>
          )}
          {/* Suggest Domains Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => suggestDomainsMutation.mutate(topic.trim())}
              disabled={
                topic.trim().length < 5 || suggestDomainsMutation.isPending
              }
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestDomainsMutation.isPending
                ? "Analyzing topic..."
                : "✨ Suggest Domains with AI"}
            </button>

            {suggestDomainsMutation.isError && (
              <p className="mt-2 text-sm text-red-500">
                {suggestDomainsMutation.error?.response?.data?.message ||
                  "Unable to generate domain suggestions."}
              </p>
            )}
          </div>
          {suggestedDomains.length > 0 && (
  <div className="mb-6 space-y-3">
    <h3 className="text-sm font-semibold">
      AI Suggested Domains
    </h3>
{/* AI Suggested domains */}
    {suggestedDomains.map((suggestion) => {
      const domain = suggestion.domain

      const isSelected = selectedDomains.some(
        (item) => item._id === domain._id
      )

      return (
        <div
          key={domain._id}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-3"
        >
          <div>
            <p className="font-medium">{domain.name}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {suggestion.reason}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleDomain(domain)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${
              isSelected
                ? 'bg-brand/15 text-green-500'
                : 'bg-surface-hover text-text-primary hover:bg-border'
            }`}
          >
            {isSelected ? 'Selected' : '+ Add'}
          </button>
        </div>
      )
    })}
  </div>
)}
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domains..."
            className="mb-3 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand"
          />

          {/* Domain results */}
          {domainsQuery.isPending ? (
            <p className="py-4 text-sm text-text-secondary">
              Loading domains...
            </p>
          ) : domainsQuery.isError ? (
            <p className="py-4 text-sm text-red-400">
              Unable to load domains. Please try again.
            </p>
          ) : domains.length === 0 ? (
            <p className="py-4 text-sm text-text-secondary">
              No matching domains found.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => {
                const selected = selectedDomains.some(
                  (item) => item._id === domain._id,
                );

                return (
                  <button
                    key={domain._id}
                    onClick={() => toggleDomain(domain)}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {domain.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Summary and continue */}
  {/* Floating Debate Summary */}
<section className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-lg">
  <div className="flex items-center justify-between gap-4">
    {/* Summary */}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-text-primary">
        {topic.trim() || "No topic selected"}
      </p>

      <p className="mt-0.5 truncate text-xs text-text-secondary">
        {selectedDomains.length > 0
          ? selectedDomains.map((domain) => domain.name).join(" · ")
          : "No domains selected"}
      </p>
    </div>

    {/* Continue */}
    <button
      onClick={continueToCouncil}
      disabled={!topic.trim()}
      className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      Select Experts →
    </button>
  </div>
</section>
      </div>
    </div>
  );
}

export default ConfigureDebate;
