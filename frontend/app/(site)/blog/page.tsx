import { Calendar, Tag } from "lucide-react";

const posts = [
  {
    title: "Primed vs. painted bumpers: what's the difference?",
    excerpt: "Most replacement bumper covers ship primed rather than painted. Here's why, and what it means for your install.",
    tag: "Body panels",
    date: "2026-06-14",
  },
  {
    title: "How to spot a failing headlight housing before it fogs",
    excerpt: "Yellowing and moisture inside the lens are early signs. We break down what's repairable and what needs a full replacement.",
    tag: "Lighting",
    date: "2026-05-28",
  },
  {
    title: "Reading your VW paint code for a perfect bumper match",
    excerpt: "Your paint code is usually on a sticker in the door jamb or engine bay. Here's how to find it and use it when ordering.",
    tag: "Body panels",
    date: "2026-05-09",
  },
  {
    title: "Side mirror housing cracked? Here's what actually needs replacing",
    excerpt: "Often it's just the housing or the glass — not the whole assembly. A quick guide to diagnosing mirror damage.",
    tag: "Mirrors & glass",
    date: "2026-04-22",
  },
  {
    title: "Windshield chip vs. crack: when a repair won't cut it",
    excerpt: "Chips under 2.5cm can often be repaired. Anything larger, or in the driver's direct line of sight, usually means replacement.",
    tag: "Mirrors & glass",
    date: "2026-04-03",
  },
  {
    title: "Grille clips and trim fasteners: the small parts that trip people up",
    excerpt: "A surprising number of \"defective part\" returns are actually missing clips. Here's what to check before you order.",
    tag: "Trim & grilles",
    date: "2026-03-18",
  },
];

export default function BlogPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Automotive blog</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Fitment tips, install guides, and buying advice from our exterior-parts specialists.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
        {posts.map((post) => (
          <article key={post.title} className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
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
