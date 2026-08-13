"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Check, X, Car } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Make { id: string; name: string; slug: string }
interface Model { id: string; name: string; slug: string; makeId: string }
interface Generation { id: string; name: string; yearFrom: number; yearTo: number | null; bodyType: string | null; modelId: string }

const inputClass = "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-red";

export default function AdminVehiclesPage() {
  const token = useAdminStore((s) => s.token);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [error, setError] = useState("");

  function loadMakes() {
    api.get<Make[]>("/vehicles/makes").then(setMakes).catch(() => {});
  }
  useEffect(loadMakes, []);

  useEffect(() => {
    if (!selectedMakeId) { setModels([]); setSelectedModelId(""); return; }
    api.get<Model[]>(`/vehicles/makes/${selectedMakeId}/models`).then(setModels).catch(() => setModels([]));
  }, [selectedMakeId]);

  useEffect(() => {
    if (!selectedModelId) { setGenerations([]); return; }
    api.get<Generation[]>(`/vehicles/models/${selectedModelId}/generations`).then(setGenerations).catch(() => setGenerations([]));
  }, [selectedModelId]);

  const selectedMake = makes.find((m) => m.id === selectedMakeId);
  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Car size={22} className="text-brand-red" /> Vehicles
        </h1>
        <p className="text-sm text-ink-soft">Manage the make / model / generation tree used for vehicle-fitment search.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MakesPanel
          makes={makes}
          selectedId={selectedMakeId}
          onSelect={setSelectedMakeId}
          onChanged={loadMakes}
          token={token}
          setError={setError}
        />
        {selectedMake && (
          <ModelsPanel
            makeId={selectedMake.id}
            makeName={selectedMake.name}
            models={models}
            selectedId={selectedModelId}
            onSelect={setSelectedModelId}
            onChanged={() => api.get<Model[]>(`/vehicles/makes/${selectedMake.id}/models`).then(setModels).catch(() => {})}
            token={token}
            setError={setError}
          />
        )}
        {selectedModel && (
          <GenerationsPanel
            modelId={selectedModel.id}
            modelName={selectedModel.name}
            generations={generations}
            onChanged={() => api.get<Generation[]>(`/vehicles/models/${selectedModel.id}/generations`).then(setGenerations).catch(() => {})}
            token={token}
            setError={setError}
          />
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function MakesPanel({
  makes, selectedId, onSelect, onChanged, token, setError,
}: {
  makes: Make[]; selectedId: string; onSelect: (id: string) => void; onChanged: () => void;
  token: string | null; setError: (s: string) => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/vehicles/makes", { name: name.trim() }, token);
      setName("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add make");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setBusyId(id);
    setError("");
    try {
      await api.patch(`/vehicles/makes/${id}`, { name: editName.trim() }, token);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update make");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    setBusyId(id);
    setError("");
    try {
      await api.delete(`/vehicles/makes/${id}`, token);
      if (id === selectedId) onSelect("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete make");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Panel title="Makes">
      <form onSubmit={handleAdd} className="mb-3 flex gap-1.5">
        <input className={inputClass} placeholder="e.g. Volkswagen" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" disabled={saving} className="flex shrink-0 items-center justify-center rounded-lg bg-brand-red px-2.5 text-white hover:bg-brand-red-dark disabled:opacity-60">
          <Plus size={16} />
        </button>
      </form>
      <ul className="max-h-[420px] space-y-0.5 overflow-y-auto">
        {makes.map((m) => (
          <li key={m.id} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm ${m.id === selectedId ? "bg-brand-red-light/60" : "hover:bg-slate-50"}`}>
            {editingId === m.id ? (
              <>
                <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <button onClick={() => saveEdit(m.id)} disabled={busyId === m.id} aria-label="Save" className="shrink-0 rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"><Check size={14} /></button>
                <button onClick={() => setEditingId(null)} aria-label="Cancel" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={() => onSelect(m.id)} className="flex-1 truncate text-left font-medium text-ink">{m.name}</button>
                <button onClick={() => { setEditingId(m.id); setEditName(m.name); }} aria-label="Edit make" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-ink"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(m.id, m.name)} disabled={busyId === m.id} aria-label="Delete make" className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={13} /></button>
              </>
            )}
          </li>
        ))}
        {makes.length === 0 && <li className="px-2 py-4 text-center text-sm text-ink-soft">No makes yet.</li>}
      </ul>
    </Panel>
  );
}

function ModelsPanel({
  makeId, makeName, models, selectedId, onSelect, onChanged, token, setError,
}: {
  makeId: string; makeName: string; models: Model[]; selectedId: string; onSelect: (id: string) => void; onChanged: () => void;
  token: string | null; setError: (s: string) => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/vehicles/models", { makeId, name: name.trim() }, token);
      setName("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add model");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setBusyId(id);
    setError("");
    try {
      await api.patch(`/vehicles/models/${id}`, { name: editName.trim() }, token);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update model");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    setBusyId(id);
    setError("");
    try {
      await api.delete(`/vehicles/models/${id}`, token);
      if (id === selectedId) onSelect("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete model");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Panel title={`${makeName} models`}>
      <form onSubmit={handleAdd} className="mb-3 flex gap-1.5">
        <input className={inputClass} placeholder="e.g. Golf" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" disabled={saving} className="flex shrink-0 items-center justify-center rounded-lg bg-brand-red px-2.5 text-white hover:bg-brand-red-dark disabled:opacity-60">
          <Plus size={16} />
        </button>
      </form>
      <ul className="max-h-[420px] space-y-0.5 overflow-y-auto">
        {models.map((m) => (
          <li key={m.id} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm ${m.id === selectedId ? "bg-brand-red-light/60" : "hover:bg-slate-50"}`}>
            {editingId === m.id ? (
              <>
                <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <button onClick={() => saveEdit(m.id)} disabled={busyId === m.id} aria-label="Save" className="shrink-0 rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"><Check size={14} /></button>
                <button onClick={() => setEditingId(null)} aria-label="Cancel" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={() => onSelect(m.id)} className="flex-1 truncate text-left font-medium text-ink">{m.name}</button>
                <button onClick={() => { setEditingId(m.id); setEditName(m.name); }} aria-label="Edit model" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-ink"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(m.id, m.name)} disabled={busyId === m.id} aria-label="Delete model" className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={13} /></button>
              </>
            )}
          </li>
        ))}
        {models.length === 0 && <li className="px-2 py-4 text-center text-sm text-ink-soft">No models yet.</li>}
      </ul>
    </Panel>
  );
}

function GenerationsPanel({
  modelId, modelName, generations, onChanged, token, setError,
}: {
  modelId: string; modelName: string; generations: Generation[]; onChanged: () => void;
  token: string | null; setError: (s: string) => void;
}) {
  const [form, setForm] = useState({ name: "", yearFrom: "", yearTo: "", bodyType: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", yearFrom: "", yearTo: "", bodyType: "" });
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const yearFrom = Number(form.yearFrom);
    if (!form.name.trim() || !Number.isFinite(yearFrom) || yearFrom < 1900) {
      setError("Generation name and a valid start year are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post(
        "/vehicles/generations",
        { modelId, name: form.name.trim(), yearFrom, yearTo: form.yearTo.trim() ? Number(form.yearTo) : null, bodyType: form.bodyType.trim() || undefined },
        token
      );
      setForm({ name: "", yearFrom: "", yearTo: "", bodyType: "" });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add generation");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(g: Generation) {
    setEditingId(g.id);
    setEditForm({ name: g.name, yearFrom: String(g.yearFrom), yearTo: g.yearTo ? String(g.yearTo) : "", bodyType: g.bodyType || "" });
  }

  async function saveEdit(id: string) {
    const yearFrom = Number(editForm.yearFrom);
    if (!editForm.name.trim() || !Number.isFinite(yearFrom)) return;
    setBusyId(id);
    setError("");
    try {
      await api.patch(
        `/vehicles/generations/${id}`,
        { name: editForm.name.trim(), yearFrom, yearTo: editForm.yearTo.trim() ? Number(editForm.yearTo) : null, bodyType: editForm.bodyType.trim() || undefined },
        token
      );
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update generation");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    setBusyId(id);
    setError("");
    try {
      await api.delete(`/vehicles/generations/${id}`, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete generation");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Panel title={`${modelName} generations`}>
      <form onSubmit={handleAdd} className="mb-3 space-y-1.5">
        <input className={inputClass} placeholder="e.g. Mk7 (2012–2020)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-1.5">
          <input className={inputClass} type="number" placeholder="Year from" value={form.yearFrom} onChange={(e) => setForm((f) => ({ ...f, yearFrom: e.target.value }))} />
          <input className={inputClass} type="number" placeholder="Year to (blank = present)" value={form.yearTo} onChange={(e) => setForm((f) => ({ ...f, yearTo: e.target.value }))} />
        </div>
        <div className="flex gap-1.5">
          <input className={inputClass} placeholder="Body type (optional)" value={form.bodyType} onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value }))} />
          <button type="submit" disabled={saving} className="flex shrink-0 items-center justify-center rounded-lg bg-brand-red px-2.5 text-white hover:bg-brand-red-dark disabled:opacity-60">
            <Plus size={16} />
          </button>
        </div>
      </form>
      <ul className="max-h-[380px] space-y-1.5 overflow-y-auto">
        {generations.map((g) => (
          <li key={g.id} className="rounded-lg border border-slate-100 px-2 py-1.5 text-sm hover:bg-slate-50">
            {editingId === g.id ? (
              <div className="space-y-1.5">
                <input className={inputClass} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                <div className="flex gap-1.5">
                  <input className={inputClass} type="number" value={editForm.yearFrom} onChange={(e) => setEditForm((f) => ({ ...f, yearFrom: e.target.value }))} />
                  <input className={inputClass} type="number" placeholder="present" value={editForm.yearTo} onChange={(e) => setEditForm((f) => ({ ...f, yearTo: e.target.value }))} />
                </div>
                <div className="flex items-center gap-1.5">
                  <input className={inputClass} placeholder="Body type" value={editForm.bodyType} onChange={(e) => setEditForm((f) => ({ ...f, bodyType: e.target.value }))} />
                  <button onClick={() => saveEdit(g.id)} disabled={busyId === g.id} aria-label="Save" className="shrink-0 rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} aria-label="Cancel" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="flex-1">
                  <p className="font-medium text-ink">{g.name}</p>
                  <p className="text-xs text-ink-soft">{g.yearFrom}–{g.yearTo ?? "present"}{g.bodyType ? ` · ${g.bodyType}` : ""}</p>
                </div>
                <button onClick={() => startEdit(g)} aria-label="Edit generation" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-ink"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(g.id, g.name)} disabled={busyId === g.id} aria-label="Delete generation" className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={13} /></button>
              </div>
            )}
          </li>
        ))}
        {generations.length === 0 && <li className="px-2 py-4 text-center text-sm text-ink-soft">No generations yet.</li>}
      </ul>
    </Panel>
  );
}
