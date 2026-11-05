import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { getExperts, createExpert } from "../services/expert";
import ExpertForm from "../components/council/ExpertForm";
import { getDomains } from "../services/domain";
export default function SelectCouncil() {
  const location = useLocation();
  const navigate = useNavigate();

  const { topic, domains = [] } = location.state || {};

  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedExperts, setSelectedExperts] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(domains);

  const domainIds = selectedDomains.map((domain) =>
    typeof domain === "string" ? domain : domain._id,
  );
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
      state: { topic, domains, experts: selectedExperts },
    });
  };

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
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
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
      <div className=" flex justify-between gap-3 flex-wrap items-center">
        
        <div className="flex flex-wrap gap-3">
          {["all", "ai", "human"].map((item) => (
            <button
              key={item}
              onClick={() => setType(item)}
              className={`rounded-lg border px-4 py-2 capitalize ${
                type === item
                  ? "border-brand bg-brand/10 text-text-primary"
                  : "border-border text-text-secondary"
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
        <button
          onClick={() => setShowExpertForm(true)}
          className="rounded-lg border border-brand px-4 py-2 text-sm text-brand hover:bg-brand/10"
        >
          + Create Expert
        </button>
      </div>

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
      onClick={(e) => e.stopProypagation()}
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
            'Failed to create expert.'}
        </p>
      )}
    </div>
  </div>
)}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {experts.map((expert) => (
          <article
            key={expert._id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{expert.name}</h3>
                <p className="text-sm text-text-secondary">{expert.role}</p>
              </div>

              <span className="rounded-md bg-surface-hover px-2 py-1 text-xs">
                {expert.isHumanLike ? "Human-like" : "AI"}
              </span>
            </div>

            <p className="mt-3 text-sm text-text-secondary">
              {expert.description}
            </p>

            {expert.isHumanLike && (
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <strong>Inspired by:</strong>{" "}
                  {expert.inspiredBy || "Original character"}
                </p>
                <p>
                  <strong>Traits:</strong> {expert.characterTraits?.join(", ")}
                </p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {expert.expertise.map((domain) => (
                <span
                  key={domain._id}
                  className="rounded-full bg-surface-hover px-2 py-1 text-xs text-text-secondary"
                >
                  {domain.name}
                </span>
              ))}
            </div>

            <button
              onClick={() => toggleExpert(expert)}
              className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium ${
                isSelected(expert._id)
                  ? "border border-brand text-brand"
                  : "bg-brand text-white hover:bg-brand-hover"
              }`}
            >
              {isSelected(expert._id)
                ? "Remove from Council"
                : "Add to Council"}
            </button>
          </article>
        ))}
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-border bg-app py-4">
        <p className="text-sm text-text-secondary">
          {selectedExperts.length}/12 members selected
        </p>

        <button
          disabled={selectedExperts.length < 2}
          onClick={handleContinue}
          className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
