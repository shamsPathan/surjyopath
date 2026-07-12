import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Newspaper,
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  Award,
  Timer,
  Sparkles,
  Heart,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useMessageStore } from "../store/useMessageStore";
import { useFriendStore } from "../store/useFriendStore";
import * as api from "../api/client";
import type { UserProfile, Publication } from "../api/types";

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { friends } = useFriendStore();
  const {
    activeConversation,
    isLoadingMessages,
    isSending,
    openConversation,
    closeConversation,
    sendMessage,
  } = useMessageStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isFriend = currentUser
    ? friends.some((f) => f.friend_id === id)
    : false;

  const showChat = searchParams.get("chat") === "true";

  useEffect(() => {
    if (!id) return;
    loadFriendProfile(id);
    if (showChat && isFriend) {
      openConversation(id);
    }
  }, [id, showChat, isFriend]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  async function loadFriendProfile(userId: string) {
    setLoading(true);
    try {
      const [userProfile, userPublications] = await Promise.all([
        api.getUserProfile(userId),
        api.getUserPublications(userId),
      ]);
      setProfile(userProfile);
      setPublications(userPublications);
    } catch (err) {
      console.warn("Failed to load friend profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!id || !messageText.trim()) return;
    try {
      await sendMessage(id, messageText.trim());
      setMessageText("");
    } catch {
      // handled by store
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function toggleChat() {
    if (showChat) {
      closeConversation();
      setSearchParams({});
    } else {
      openConversation(id!);
      setSearchParams({ chat: "true" });
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted">Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <User size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="text-sm text-muted">User not found</p>
          <button
            onClick={() => navigate("/friends")}
            className="mt-4 text-sm text-primary hover:underline cursor-pointer"
          >
            Back to Friends
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/friends")}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors duration-200 mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Friends
        </button>

        {/* Profile card */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{profile.avatar_emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-heading font-bold text-foreground truncate">
                {profile.nickname}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>Level {profile.level}</span>
                <span>·</span>
                <span>{profile.xp} XP</span>
              </div>
            </div>
            {isFriend && (
              <button
                onClick={toggleChat}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all duration-200 active:scale-[0.97] cursor-pointer"
              >
                <MessageCircle size={16} />
                {showChat ? "Close Chat" : "Send Message"}
              </button>
            )}
          </div>

          {profile.bio && (
            <div className="mb-4">
              <p className="text-xs text-muted mb-1">Bio</p>
              <p className="text-sm text-foreground/80">{profile.bio}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Timer size={12} className="text-muted" />
            <p className="text-xs text-muted">
              Joined {new Date(profile.joined_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      {showChat && (
        <div className="mb-6 rounded-xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover/50">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MessageCircle size={14} className="text-primary" />
              Chat with {profile.nickname}
            </h3>
            <button
              onClick={toggleChat}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors duration-200 cursor-pointer"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-bg/30">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : activeConversation?.messages.length ? (
              activeConversation.messages.map((msg) => {
                const isMine = msg.sender_id === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                        isMine
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-surface-hover text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMine ? "text-white/60" : "text-muted"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted">
                  No messages yet. Say hello!
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={isSending}
              className="flex-1 bg-bg/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Publications */}
      <div>
        <h2 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Newspaper size={14} className="text-primary" />
          Publications by {profile.nickname}
        </h2>

        {publications.length > 0 ? (
          <div className="space-y-3">
            {publications.map((pub) => (
              <button
                key={pub.id}
                onClick={() => navigate(`/publications/${pub.id}`)}
                className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 active:scale-[0.98] cursor-pointer group"
              >
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 mb-1">
                  {pub.title}
                </h3>
                <p className="text-xs text-muted/80 line-clamp-2 mb-2">
                  {pub.content}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Heart size={12} />
                    {pub.likes}
                  </span>
                  <span>{new Date(pub.created_at).toLocaleDateString()}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-bg/50 text-[10px] capitalize">
                    {pub.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <Newspaper size={24} className="mx-auto text-muted/40 mb-2" />
            <p className="text-sm text-muted">No publications yet</p>
            <p className="text-xs text-muted/60 mt-1">
              {profile.nickname} hasn't published anything yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}