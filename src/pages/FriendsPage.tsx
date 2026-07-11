import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  Send,
  Loader2,
  Mail,
  MailOpen,
  UserMinus,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import type { SearchUserResult, FriendRequest, Friendship } from "../api/types";

type Tab = "friends" | "incoming" | "outgoing";

/* ─── Search Results ─── */

function SearchResultCard({
  user,
  onSendRequest,
}: {
  user: SearchUserResult;
  onSendRequest: (id: string) => void;
}) {
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    setSending(true);
    await onSendRequest(user.id);
    setSending(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-all duration-150 rounded-lg group">
      <span className="text-xl flex-shrink-0">{user.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user.nickname}
        </p>
        {user.bio && (
          <p className="text-xs text-muted truncate">{user.bio}</p>
        )}
        <p className="text-[11px] text-muted/60">
          Lvl {user.level} &middot; {user.xp} XP
        </p>
      </div>
      <button
        onClick={handleClick}
        disabled={sending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
        aria-label={`Send friend request to ${user.nickname}`}
      >
        {sending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <UserPlus size={14} />
        )}
        Add
      </button>
    </div>
  );
}

/* ─── Friend Card ─── */

function FriendCard({
  friendship,
  onRemove,
}: {
  friendship: Friendship;
  onRemove: (friendId: string) => void;
}) {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);
  const friend = friendship.friend;

  if (!friend) return null;

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(friend.id);
    setRemoving(false);
  };

  const handleViewProfile = () => {
    navigate(`/friends/${friend.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/friends/${friend.id}?openChat=true`);
  };

  return (
    <div
      onClick={handleViewProfile}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface border border-border hover:border-primary/20 hover:bg-surface-hover transition-all duration-200 group cursor-pointer active:scale-[0.99]"
    >
      <span className="text-xl flex-shrink-0">{friend.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-150">
          {friend.nickname}
        </p>
        {friend.bio && (
          <p className="text-xs text-muted truncate">{friend.bio}</p>
        )}
        <p className="text-[11px] text-muted/60">
          Lvl {friend.level} &middot; {friend.xp} XP
        </p>
      </div>
      <button
        onClick={handleMessage}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all duration-150 active:scale-95"
        aria-label={`Message ${friend.nickname}`}
      >
        <MessageCircle size={14} />
        <span className="hidden sm:inline">Message</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        disabled={removing}
        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-destructive text-xs font-medium hover:bg-destructive/10 transition-all duration-200 active:scale-95 disabled:opacity-30"
        aria-label={`Remove ${friend.nickname} as friend`}
      >
        {removing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <UserMinus size={14} />
        )}
        Remove
      </button>
    </div>
  );
}

/* ─── Incoming Request Card ─── */

function IncomingRequestCard({
  request,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  onAccept: (id: string, fromUserId: string) => void;
  onDecline: (id: string) => void;
}) {
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);
  const fromUser = request.from_user;

  if (!fromUser) return null;

  const handleAccept = async () => {
    setActing("accept");
    await onAccept(request.id, fromUser.id);
    setActing(null);
  };

  const handleDecline = async () => {
    setActing("decline");
    await onDecline(request.id);
    setActing(null);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface border border-border transition-all duration-200">
      <span className="text-xl flex-shrink-0">{fromUser.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {fromUser.nickname}
        </p>
        {fromUser.bio && (
          <p className="text-xs text-muted truncate">{fromUser.bio}</p>
        )}
        <p className="text-[11px] text-muted/60">
          Lvl {fromUser.level} &middot; {fromUser.xp} XP
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={acting !== null}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
          aria-label={`Accept friend request from ${fromUser.nickname}`}
        >
          {acting === "accept" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={acting !== null}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-muted text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-all duration-150 active:scale-95 disabled:opacity-50"
          aria-label={`Decline friend request from ${fromUser.nickname}`}
        >
          {acting === "decline" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <X size={14} />
          )}
          Decline
        </button>
      </div>
    </div>
  );
}

/* ─── Outgoing Request Card ─── */

function OutgoingRequestCard({
  request,
  onCancel,
}: {
  request: FriendRequest;
  onCancel: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const toUser = request.to_user;

  if (!toUser) return null;

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(request.id);
    setCancelling(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface border border-border/50 transition-all duration-200">
      <span className="text-xl flex-shrink-0">{toUser.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {toUser.nickname}
        </p>
        <p className="text-xs text-muted/60 flex items-center gap-1">
          <Clock size={12} />
          Pending
        </p>
      </div>
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-surface-hover transition-all duration-150 active:scale-95 disabled:opacity-50"
        aria-label={`Cancel friend request to ${toUser.nickname}`}
      >
        {cancelling ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <X size={14} />
        )}
        Cancel
      </button>
    </div>
  );
}

/* ─── Main Component ─── */

export default function FriendsPage() {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchResults,
    isSearching,
    isInitializing,
    searchQuery,
    initialize,
    searchUsers,
    clearSearch,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useFriendStore();

  const { profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [localQuery, setLocalQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (profile) initialize();
  }, [profile, initialize]);

  // Debounced search
  const handleSearchInput = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) {
          searchUsers(value);
        } else {
          clearSearch();
        }
      }, 300);
    },
    [searchUsers, clearSearch],
  );

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        clearSearch();
        setLocalQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSearch]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: "friends", label: "Friends", icon: Users, count: friends.length },
    {
      key: "incoming",
      label: "Incoming",
      icon: MailOpen,
      count: incomingRequests.length,
    },
    {
      key: "outgoing",
      label: "Outgoing",
      icon: Send,
      count: outgoingRequests.length,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg shadow-primary/10">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Friends
            </h1>
            <p className="text-sm text-muted">
              Connect with fellow learners, thoughtfully.
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {/* Search with dropdown results */}
      <div className="relative mb-6" ref={searchRef}>
        <label htmlFor="friend-search" className="sr-only">
          Search for friends
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            ref={inputRef}
            id="friend-search"
            type="text"
            value={localQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search by nickname or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
            aria-autocomplete="list"
            aria-expanded={searchResults.length > 0}
            aria-controls="search-results"
            autoComplete="off"
          />
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div
            id="search-results"
            role="listbox"
            className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg shadow-black/20 overflow-hidden"
          >
            <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-muted/60 font-medium border-b border-border">
              Search Results
            </div>
            {searchResults.map((user) => (
              <SearchResultCard
                key={user.id}
                user={user}
                onSendRequest={sendRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-surface border border-border rounded-lg" role="tablist" aria-label="Friend sections">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`tabpanel-${key}`}
            onClick={() => setActiveTab(key)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium
              transition-all duration-200 active:scale-[0.97]
              ${
                activeTab === key
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }
            `}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`
                  text-[11px] px-1.5 py-0.5 rounded-full font-medium
                  ${
                    activeTab === key
                      ? "bg-primary/20 text-primary"
                      : "bg-bg text-muted"
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isInitializing ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Friends Tab */}
          <div
            id="tabpanel-friends"
            role="tabpanel"
            aria-labelledby="tab-friends"
            hidden={activeTab !== "friends"}
          >
            {friends.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No friends yet"
                description="Search for friends above. Friend requests are thoughtfully reviewed to keep your space safe."
              />
            ) : (
              <div className="space-y-2">
                {friends.map((f) => (
                  <FriendCard
                    key={f.id}
                    friendship={f}
                    onRemove={removeFriend}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Incoming Tab */}
          <div
            id="tabpanel-incoming"
            role="tabpanel"
            aria-labelledby="tab-incoming"
            hidden={activeTab !== "incoming"}
          >
            {incomingRequests.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No incoming requests"
                description="When someone sends you a friend request, it will appear here."
              />
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((r) => (
                  <IncomingRequestCard
                    key={r.id}
                    request={r}
                    onAccept={acceptRequest}
                    onDecline={declineRequest}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Tab */}
          <div
            id="tabpanel-outgoing"
            role="tabpanel"
            aria-labelledby="tab-outgoing"
            hidden={activeTab !== "outgoing"}
          >
            {outgoingRequests.length === 0 ? (
              <EmptyState
                icon={Send}
                title="No outgoing requests"
                description="Friend requests you've sent will show up here while they're pending."
              />
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map((r) => (
                  <OutgoingRequestCard
                    key={r.id}
                    request={r}
                    onCancel={cancelRequest}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <Icon size={28} className="text-muted" />
      </div>
      <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
        {title}
      </h2>
      <p className="text-sm text-muted max-w-xs mx-auto">{description}</p>
    </div>
  );
}