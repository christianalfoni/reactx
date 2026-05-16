import { useTransition, useState } from "react";
import { app, type Post } from "../app";

// ── Post list — uses Suspense via use(), stale-while-revalidate via useTransition

function PostList() {
  const [isRefreshing, startTransition] = useTransition();

  return (
    <div>
      <div className="section-header">
        <button
          className="secondary"
          onClick={() => startTransition(() => app.refreshPosts())}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>
      <ul className="post-list" style={{ opacity: isRefreshing ? 0.5 : 1 }}>
        {app.posts.map((post) => (
          <li key={post.id}>
            <strong>{post.title}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Create post — mutation via async action + useTransition

function CreatePost() {
  const [title, setTitle] = useState("");
  const [lastCreated, setLastCreated] = useState<Post | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    startTransition(async () => {
      const post = await app.createPost(text);
      setLastCreated(post);
      setTitle("");
    });
  }

  return (
    <div className="create-post">
      <form className="create-form" onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New post title…"
          disabled={isPending}
        />
        <button type="submit" disabled={isPending || !title.trim()}>
          {isPending ? "Saving…" : "Create"}
        </button>
      </form>
      {lastCreated && (
        <p className="success">✓ Created: "{lastCreated.title}"</p>
      )}
    </div>
  );
}

// ── Section shell — Suspense boundary lives in App.tsx above this

export function Posts() {
  return (
    <section className="section">
      <h2>
        Posts <span className="tag">async · Suspense · useTransition</span>
      </h2>
      <PostList />
      <hr className="divider" />
      <CreatePost />
    </section>
  );
}
