"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDate, CATEGORIES } from "@/lib/utils";
import type { PrayerCategory } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";

export default function MyPrayersPage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "answered"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const prayers = useQuery(api.prayers.list, {
    status: statusFilter,
    category: categoryFilter || undefined,
    person: personFilter || undefined,
  });
  const people = useQuery(api.people.list);

  const createPrayer = useMutation(api.prayers.create);
  const markAnswered = useMutation(api.prayers.markAnswered);
  const unmarkAnswered = useMutation(api.prayers.unmarkAnswered);
  const generateShareId = useMutation(api.prayers.generateShareId);
  const removePrayer = useMutation(api.prayers.remove);

  // Add prayer form state
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<PrayerCategory>("Personal");
  const [newPerson, setNewPerson] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleAddPrayer() {
    if (!newText.trim()) return;
    await createPrayer({
      text: newText.trim(),
      category: newCategory,
      person: newPerson.trim() || undefined,
    });
    setNewText("");
    setNewCategory("Personal");
    setNewPerson("");
    setShowAddModal(false);
  }

  async function handleShare(prayerId: string) {
    const shareId = await generateShareId({
      prayerId: prayerId as ReturnType<typeof api.prayers.generateShareId>["_args"]["prayerId"],
    });
    const url = `${window.location.origin}/request/${shareId}`;
    await navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  }

  async function handleDelete() {
    if (!deleteId) return;
    await removePrayer({
      prayerId: deleteId as ReturnType<typeof api.prayers.remove>["_args"]["prayerId"],
    });
    setDeleteId(null);
  }

  // Get unique people from current prayers for filter
  const uniquePeople = people
    ? people.map((p) => p.name)
    : [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-white">My Prayers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-gold text-brand-black px-4 py-2 rounded-lg font-medium hover:bg-brand-gold-light transition-colors"
        >
          + Add Prayer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "answered")
          }
          className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-gold"
        >
          <option value="all">All Prayers</option>
          <option value="active">Active</option>
          <option value="answered">Answered</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-gold"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {uniquePeople.length > 0 && (
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-gold"
          >
            <option value="">All People</option>
            {uniquePeople.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Prayer Feed */}
      {prayers === undefined ? (
        <div className="text-center py-12 text-brand-muted">Loading...</div>
      ) : prayers.length === 0 ? (
        <EmptyState
          emoji="🙏"
          title="No prayers yet"
          description="Start your prayer journal by adding your first prayer."
          action={{ label: "Add Prayer", onClick: () => setShowAddModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <div
              key={prayer._id}
              className={`bg-brand-card border rounded-xl p-4 ${
                prayer.isAnswered
                  ? "border-brand-gold/30"
                  : "border-brand-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-brand-white mb-2">{prayer.text}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-brand-dark px-2 py-1 rounded text-brand-muted">
                      {prayer.category}
                    </span>
                    {prayer.person && (
                      <span className="bg-brand-dark px-2 py-1 rounded text-brand-gold">
                        {prayer.person}
                      </span>
                    )}
                    <span className="text-brand-muted">
                      {formatDate(prayer.createdAt)}
                    </span>
                    {prayer.isAnswered && prayer.answeredAt && (
                      <span className="text-brand-gold flex items-center gap-1">
                        <span>&#10003;</span> Answered {formatDate(prayer.answeredAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-brand-border">
                {prayer.isAnswered ? (
                  <button
                    onClick={() =>
                      unmarkAnswered({
                        prayerId: prayer._id,
                      })
                    }
                    className="text-xs px-3 py-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-white transition-colors"
                  >
                    Unmark Answered
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      markAnswered({
                        prayerId: prayer._id,
                      })
                    }
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors"
                  >
                    Mark Answered
                  </button>
                )}
                <button
                  onClick={() => handleShare(prayer._id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-white transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={() => setDeleteId(prayer._id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Prayer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-brand-white">Add Prayer</h2>

            <div>
              <label className="text-sm text-brand-muted mb-1 block">
                What are you praying for?
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={3}
                placeholder="Write your prayer..."
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-brand-white placeholder-brand-muted focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            <div>
              <label className="text-sm text-brand-muted mb-1 block">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PrayerCategory)}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-brand-white focus:outline-none focus:border-brand-gold"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-brand-muted mb-1 block">
                Person (optional)
              </label>
              <input
                type="text"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Who are you praying for?"
                list="people-suggestions"
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-brand-white placeholder-brand-muted focus:outline-none focus:border-brand-gold"
              />
              {people && people.length > 0 && (
                <datalist id="people-suggestions">
                  {people.map((p) => (
                    <option key={p._id} value={p.name} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-brand-border text-brand-muted rounded-xl hover:text-brand-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrayer}
                disabled={!newText.trim()}
                className="flex-1 py-3 bg-brand-gold text-brand-black font-semibold rounded-xl hover:bg-brand-gold-light transition-colors disabled:opacity-50"
              >
                Save Prayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-brand-white">
              Delete Prayer?
            </h2>
            <p className="text-brand-muted text-sm">
              This will permanently remove this prayer from your journal. This
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-brand-border text-brand-muted rounded-xl hover:text-brand-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
