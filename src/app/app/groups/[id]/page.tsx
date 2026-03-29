"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { formatDate } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/ui/empty-state";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as Id<"groups">;

  const group = useQuery(api.groups.getById, { groupId });
  const members = useQuery(api.groups.listMembers, { groupId });
  const groupRequests = useQuery(api.groups.listGroupRequests, { groupId });
  const myPrayers = useQuery(api.prayers.list, {
    status: "all",
  });

  const sharePrayer = useMutation(api.groups.sharePrayerToGroup);
  const prayForRequest = useMutation(api.groups.prayForRequest);
  const removeMember = useMutation(api.groups.removeMember);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  if (group === undefined) {
    return (
      <div className="p-4 md:p-6 text-center text-brand-muted">Loading...</div>
    );
  }

  if (group === null) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-brand-muted mb-4">Group not found or you don&apos;t have access.</p>
        <Link href="/app/groups" className="text-brand-gold hover:text-brand-gold-light">
          Back to Groups
        </Link>
      </div>
    );
  }

  async function handleSharePrayer(prayerId: string) {
    try {
      await sharePrayer({
        groupId: groupId as Id<"groups">,
        prayerId: prayerId as Id<"prayers">,
      });
      setShowShareModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to share");
    }
  }

  async function handlePray(groupRequestId: string) {
    await prayForRequest({
      groupRequestId: groupRequestId as Id<"groupRequests">,
    });
  }

  async function handleRemoveMember(memberId: string) {
    await removeMember({
      memberId: memberId as Id<"groupMembers">,
    });
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/app/groups")}
            className="text-brand-muted text-sm hover:text-brand-white mb-1 block"
          >
            &larr; Back to Groups
          </button>
          <h1 className="text-2xl font-bold text-brand-white">{group.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMembersPanel(!showMembersPanel)}
            className="text-sm px-3 py-2 rounded-lg border border-brand-border text-brand-muted hover:text-brand-white transition-colors"
          >
            Members ({members?.length || 0})
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-brand-gold text-brand-black px-4 py-2 rounded-lg font-medium hover:bg-brand-gold-light transition-colors text-sm"
          >
            Share Prayer
          </button>
        </div>
      </div>

      {/* Members Panel */}
      {showMembersPanel && members && (
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <h3 className="font-semibold text-brand-white mb-3">Members</h3>
          {members.length === 0 ? (
            <p className="text-brand-muted text-sm">
              No members yet. Invite someone from the Groups page.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between py-2 border-b border-brand-border last:border-0"
                >
                  <span className="text-brand-white text-sm">
                    {member.email}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Feed */}
      {groupRequests === undefined ? (
        <div className="text-center py-12 text-brand-muted">Loading...</div>
      ) : groupRequests.length === 0 ? (
        <EmptyState
          emoji="🙏"
          title="No prayer requests shared yet"
          description="Share a prayer from your journal so the group can pray with you."
          action={{ label: "Share a Prayer", onClick: () => setShowShareModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {groupRequests.map((req) => (
            <div
              key={req._id}
              className={`bg-brand-card border rounded-xl p-4 ${
                req.prayerIsAnswered
                  ? "border-brand-gold/30"
                  : "border-brand-border"
              }`}
            >
              <p className="text-brand-white mb-2">{req.prayerText}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                <span className="bg-brand-dark px-2 py-1 rounded text-brand-muted">
                  {req.prayerCategory}
                </span>
                {req.prayerPerson && (
                  <span className="bg-brand-dark px-2 py-1 rounded text-brand-gold">
                    {req.prayerPerson}
                  </span>
                )}
                <span className="text-brand-muted">
                  {formatDate(req.createdAt)}
                </span>
                {req.prayerIsAnswered && (
                  <span className="text-brand-gold">&#10003; Answered</span>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
                <button
                  onClick={() => handlePray(req._id)}
                  disabled={req.prayedByMe}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                    req.prayedByMe
                      ? "bg-brand-gold/10 text-brand-gold cursor-default"
                      : "bg-brand-gold text-brand-black hover:bg-brand-gold-light"
                  }`}
                >
                  {req.prayedByMe ? "Prayed" : "I Prayed for This"}
                </button>
                <span className="text-brand-muted text-xs">
                  {req.groupPrayerCount}{" "}
                  {req.groupPrayerCount === 1 ? "person" : "people"} prayed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Prayer Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md space-y-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-brand-white">
              Share a Prayer to {group.name}
            </h2>
            <p className="text-brand-muted text-sm">
              Pick a prayer from your journal to share with the group.
            </p>

            {myPrayers === undefined ? (
              <p className="text-brand-muted text-sm">Loading prayers...</p>
            ) : myPrayers.length === 0 ? (
              <p className="text-brand-muted text-sm">
                No prayers in your journal yet.{" "}
                <Link
                  href="/app"
                  className="text-brand-gold hover:text-brand-gold-light"
                >
                  Add one first.
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {myPrayers.map((prayer) => (
                  <button
                    key={prayer._id}
                    onClick={() => handleSharePrayer(prayer._id)}
                    className="w-full text-left bg-brand-dark border border-brand-border rounded-lg p-3 hover:border-brand-gold/30 transition-colors"
                  >
                    <p className="text-brand-white text-sm line-clamp-2">
                      {prayer.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-brand-muted">
                      <span>{prayer.category}</span>
                      {prayer.person && (
                        <span className="text-brand-gold">
                          {prayer.person}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 border border-brand-border text-brand-muted rounded-xl hover:text-brand-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
