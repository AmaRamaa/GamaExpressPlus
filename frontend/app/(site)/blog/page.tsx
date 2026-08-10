"use client";

import { Calendar, Tag } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function BlogPage() {
  const { t } = useT();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">{t.blog.pageTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.blog.pageSubtitle}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
        {t.blog.posts.map((post, i) => (
          <article key={i} className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1 rounded-full bg-brand-red-light px-2.5 py-1 font-medium text-brand-red">
                <Tag size={11} /> {post.tag}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <h2 className="font-display text-base font-semibold text-ink">{post.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
