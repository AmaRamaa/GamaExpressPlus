"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EntityCombobox } from "@/components/admin/EntityCombobox";
import { LogoUploader } from "@/components/admin/LogoUploader";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  productCount: number;
  children: Category[];
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const token = useAdminStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function load() {
    api.get<Category[]>("/catalog/categories").then(setCategories).catch(() => {});
  }
  useEffect(load, []);

  const totalCount = categories.reduce((sum, c) => sum + 1 + c.children.length, 0);
  const parentOptions = categories
    .filter((c) => c.id !== editing?.id)
    .map((c) => ({ id: c.id, name: c.name }));
  const canPickParent = !editing || editing.children.length === 0;

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setParentId("");
    setError("");
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description || "");
    setImageUrl(category.imageUrl || "");
    setParentId(category.parentId || "");
    setError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        slug: slugify(name),
        description: description.trim() || undefined,
        imageUrl: imageUrl || undefined,
        parentId: canPickParent && parentId ? parentId : null,
      };
      if (editing) {
        await api.put(`/catalog/categories/${editing.id}`, body, token);
      } else {
        await api.post("/catalog/categories", body, token);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await api.delete(`/catalog/categories/${deleteTarget.id}`, token);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete category");
    }
  }

  function Row({ category, indent }: { category: Category; indent: boolean }) {
    return (
      <li className="flex items-center gap-3 px-4 py-2.5">
        {indent && <span className="ml-4 text-slate-300">└</span>}
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.imageUrl} alt="" className="size-6 rounded object-contain" />
        ) : (
          <div className="size-6 rounded bg-slate-100" />
        )}
        <span className="text-sm font-medium text-ink">{category.name}</span>
        <span className="text-xs text-ink-soft">/{category.slug}</span>
        <Link href={`/admin/categories/${category.id}`} className="ml-auto text-xs font-medium text-brand-red hover:underline">
          {category.productCount} products
        </Link>
        <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
          <Pencil size={14} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(category); setDeleteError(""); }}>
          <Trash2 size={14} className="text-red-500" />
        </Button>
      </li>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
          <p className="text-sm text-ink-soft">{totalCount} categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add category
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <div key={c.id}>
              <Row category={c} indent={false} />
              {c.children.map((ch) => (
                <Row key={ch.id} category={ch as Category} indent />
              ))}
            </div>
          ))}
          {categories.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">No categories yet.</li>}
        </ul>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
            </div>
            <div>
              <Label>Image</Label>
              <LogoUploader value={imageUrl} onChange={setImageUrl} token={token} />
            </div>
            <div>
              <Label>Parent category</Label>
              {canPickParent ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <EntityCombobox value={parentId} onChange={setParentId} options={parentOptions} placeholder="None (top-level)" />
                  </div>
                  {parentId && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setParentId("")}>
                      Clear
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-ink-soft">This category has subcategories, so it can&apos;t be nested itself.</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
              {deleteError && <span className="mt-2 block text-red-600">{deleteError}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
