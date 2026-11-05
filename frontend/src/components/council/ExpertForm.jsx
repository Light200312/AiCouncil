
import { useState } from 'react'

export default function ExpertForm({
  domains,
  initialExpertise = [],
  onSubmit,
  onCancel,
  isPending,
}) {
  const [form, setForm] = useState({
    name: '',
    role: '',
    description: '',
    expertise: initialExpertise,
    isHumanLike: false,
    backstory: '',
    speechPattern: '',
    characterTraits: '',
    inspiredBy: '',
    systemPrompt: '',
  })

  const update = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const toggleDomain = (id) => {
    update(
      'expertise',
      form.expertise.includes(id)
        ? form.expertise.filter(item => item !== id)
        : [...form.expertise, id],
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const data = {
      ...form,
      expertise: form.expertise,
      characterTraits: form.isHumanLike
        ? form.characterTraits.split(',').map(item => item.trim()).filter(Boolean)
        : [],
    }

    delete data.characterTraitsInput

    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && !data[key].trim()) {
        delete data[key]
      }
    })

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        {/* <h2 className="text-xl font-semibold">Create Custom Expert</h2> */}
        <p className="mt-1 text-sm text-text-secondary">
          Create an expert you can reuse in future debates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          minLength={2}
          maxLength={100}
          placeholder="Expert name"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          className="rounded-lg border bg-surface px-3 py-2"
        />

        <input
          required
          minLength={2}
          maxLength={100}
          placeholder="Role / Title"
          value={form.role}
          onChange={e => update('role', e.target.value)}
          className="rounded-lg border bg-surface px-3 py-2"
        />
      </div>

      <textarea
        maxLength={500}
        placeholder="Short description"
        value={form.description}
        onChange={e => update('description', e.target.value)}
        className="w-full rounded-lg border bg-surface px-3 py-2"
        rows={2}
      />

      <div>
        <p className="mb-2 text-sm font-medium">Expertise domains</p>
        <div className="flex flex-wrap gap-2">
          {domains.map(domain => (
            <button
              key={domain._id}
              type="button"
              onClick={() => toggleDomain(domain._id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                form.expertise.includes(domain._id)
                  ? 'border-brand bg-brand/10 text-text-primary'
                  : 'border-border text-text-secondary'
              }`}
            >
              {domain.name}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Select at least one domain.
        </p>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isHumanLike}
          onChange={e => update('isHumanLike', e.target.checked)}
        />
        <span className="text-sm font-medium">
          Create a human-like character
        </span>
      </label>

      {form.isHumanLike && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <input
            placeholder="Inspired by (optional)"
            maxLength={100}
            value={form.inspiredBy}
            onChange={e => update('inspiredBy', e.target.value)}
            className="w-full rounded-lg border bg-surface px-3 py-2"
          />

          <textarea
            required
            maxLength={2000}
            placeholder="Character backstory"
            value={form.backstory}
            onChange={e => update('backstory', e.target.value)}
            className="w-full rounded-lg border bg-surface px-3 py-2"
            rows={3}
          />

          <textarea
            required
            maxLength={1000}
            placeholder="How should this character speak?"
            value={form.speechPattern}
            onChange={e => update('speechPattern', e.target.value)}
            className="w-full rounded-lg border bg-surface px-3 py-2"
            rows={2}
          />

          <input
            required
            placeholder="Character traits (comma separated)"
            value={form.characterTraits}
            onChange={e => update('characterTraits', e.target.value)}
            className="w-full rounded-lg border bg-surface px-3 py-2"
          />
        </div>
      )}

      <textarea
        maxLength={4000}
        placeholder="Additional system instructions (optional)"
        value={form.systemPrompt}
        onChange={e => update('systemPrompt', e.target.value)}
        className="w-full rounded-lg border bg-surface px-3 py-2"
        rows={3}
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isPending || !form.expertise.length}
          className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Expert'}
        </button>
      </div>
    </form>
  )
}
