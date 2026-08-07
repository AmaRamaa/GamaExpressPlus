"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { LogoUploader } from "./LogoUploader";

interface Entity {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isOEM?: boolean;
  productCount: number;
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function EntityManagerPage({
  title,
  apiPath,
  entityLabel,
  detailBasePath,
  showOEM,
}: {
  title: string;
  apiPath: string;
  entityLabel: string;
  detailBasePath: string;
  showOEM?: boolean;
}) {
  const token = useAdminStore((s) => s.token);
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isOEM, setIsOEM] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function load() {
    setLoading(true);
    api
      .get<Entity[]>(apiPath)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [apiPath]);

  function openCreate() {
    setEditing(null);
    setName("");
    setLogoUrl("");
    setIsOEM(false);
    setError("");
    setDialogOpen(true);
  }

  function openEdit(entity: Entity) {
    setEditing(entity);
    setName(entity.name);
    setLogoUrl(entity.logoUrl || "");
    setIsOEM(!!entity.isOEM);
    setError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const body = { name: name.trim(), slug: slugify(name), logoUrl: logoUrl || undefined, ...(showOEM ? { isOEM } : {}) };
      if (editing) {
        await api.put(`${apiPath}/${editing.id}`, body, token);
      } else {
        await api.post(apiPath, body, token);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to save ${entityLabel}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await api.delete(`${apiPath}/${deleteTarget.id}`, token);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : `Failed to delete ${entityLabel}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-ink-soft">{items.length} {entityLabel}{items.length === 1 ? "" : "s"}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add {entityLabel}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              {showOEM && <TableHead>OEM</TableHead>}
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logoUrl} alt="" className="size-8 rounded object-contain" />
                  ) : (
                    <div className="size-8 rounded bg-slate-100" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-ink-soft">/{item.slug}</TableCell>
                {showOEM && (
                  <TableCell>
                    {item.isOEM && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">OEM</span>}
                  </TableCell>
                )}
                <TableCell>
                  <Link href={`${detailBasePath}/${item.id}`} className="text-brand-red hover:underline">
                    {item.productCount}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(item); setDeleteError(""); }}>
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={showOEM ? 6 : 5} className="py-8 text-center text-ink-soft">
                  No {entityLabel}s yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <Label>Logo</Label>
              <LogoUploader value={logoUrl} onChange={setLogoUrl} token={token} />
            </div>
            {showOEM && (
              <label className="flex items-center gap-2 text-sm text-ink">
                <Checkbox checked={isOEM} onCheckedChange={(v) => setIsOEM(v === true)} />
                OEM
              </label>
            )}
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
