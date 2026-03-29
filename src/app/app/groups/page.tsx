"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { formatDate } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";
import Link from "next/link";

export default function GroupsPage() {
  const groups = useQuery(api.groups.list);
  const createGroup = useMutation(api.groups.create);
  const removeGroup = useMutation(api.groups.remove);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const inviteMember = useMutation(api.groups.inviteMember);

  async function handleCreate() {
    if (!newName.trim()) return;
    await createGroup({ name: newName.trim() });
    setNewName("");
    setShowCreateModal(false);
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !showInviteModal) return;
    try {
      await inviteMember({
        groupId: showInviteModal as Id<"groups">,
        email: inviteEmail.trim(),
      });
      setInviteEmail("");
      setShowInviteModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to invite");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await removeGroup({
      groupId: deleteId as Id<"groups">,
    });
    setDeleteId(null);
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-white">Prayer Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-gold text-brand-black px-4 py-2 rounded-lg font-medium hover:bg-brand-gold-light transition-colors"
        >
          + New Group
        </button>
      </div>

      {groups === undefined ? (
        <div className="text-center py-12 text-brand-muted">Loading...</div>
      ) : groups.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="No prayer groups yet"
          description="Create a group to pray together with family, friends, or your small group."
          action={{ label: "Create Group", onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group._id}
              className="bg-brand-card border border-brand-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/app/groups/${group._id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="text-lg font-semibold text-brand-white hover:text-brand-gold transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-brand-muted text-xs mt-1">
                    Created {formatDate(group.createdAt)}
                  </p>
                </Link>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => setShowInviteModal(group._id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors"
                  >
                    Invite
                  </button>
                  <button
                    onClick={() => setDeleteId(group._id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-brand-white">
              Create Prayer Group
            </h2>
            <div>
              <label className="text-sm text-brand-muted mb-1 block">
                Group Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Small Group, Family, Men's Bible Study"
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-brand-white placeholder-brand-muted focus:outline-none focus:border-brand-gold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border border-brand-border text-brand-muted rounded-xl hover:text-brand-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-3 bg-brand-gold text-brand-black font-semibold rounded-xl hover:bg-brand-gold-light transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-brand-white">
              Invite Member
            </h2>
            <div>
              <label className="text-sm text-brand-muted mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-brand-white placeholder-brand-muted focus:outline-none focus:border-brand-gold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
              />
            </div>
            <p className="text-brand-muted text-xs">
              They&apos;ll see your group when they sign in with this email.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowInviteModal(null);
                  setInviteEmail("");
                }}
                className="flex-1 py-3 border border-brand-border text-brand-muted rounded-xl hover:text-brand-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="flex-1 py-3 bg-brand-gold text-brand-black font-semibold rounded-xl hover:bg-brand-gold-light transition-colors disabled:opacity-50"
              >
                Invite
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
              Delete Group?
            </h2>
            <p className="text-brand-muted text-sm">
              This will permanently delete this group and all shared requests.
              This cannot be undone.
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
