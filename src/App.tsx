import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useJournalStore } from "./store/useJournalStore";
import { usePublicationStore } from "./store/usePublicationStore";
import { useLibraryStore } from "./store/useLibraryStore";
import { useFriendStore } from "./store/useFriendStore";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import JournalPage from "./pages/JournalPage";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import LibraryPage from "./pages/LibraryPage";
import PublicationsPage from "./pages/PublicationsPage";
import ArticleView from "./pages/ArticleView";
import FriendsPage from "./pages/FriendsPage";
import FriendProfilePage from "./pages/FriendProfilePage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import GalaxyPage from "./pages/GalaxyPage";

function AppLayout() {
  return <Layout />;
}

/** Redirects unauthenticated users to /auth, saving the return path */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    // Save current path so auth page can redirect back after login
    const currentPath = window.location.pathname;
    sessionStorage.setItem("auth_return_path", currentPath);
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const initJournal = useJournalStore((s) => s.initialize);
  const initPublications = usePublicationStore((s) => s.initialize);
  const initLibrary = useLibraryStore((s) => s.initialize);
  const initFriends = useFriendStore((s) => s.initialize);

  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isLoading) {
      initJournal(isAuthenticated);
      initPublications(isAuthenticated);
      initLibrary(isAuthenticated);
      initFriends(isAuthenticated);
    }
  }, [isLoading, isAuthenticated, initJournal, initPublications, initLibrary, initFriends]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading your galaxy…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          isAuthenticated ? (
            <Navigate to={(() => {
              const returnPath = sessionStorage.getItem("auth_return_path");
              sessionStorage.removeItem("auth_return_path");
              return returnPath || "/";
            })()} replace />
          ) : (
            <AuthPage />
          )
        }
      />
      {/* Publication detail is standalone (no sidebar) — public, shareable */}
      <Route path="/publications/:id" element={<ArticleView />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<GalaxyPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/goals/:id" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        <Route path="/friends/:id" element={<ProtectedRoute><FriendProfilePage /></ProtectedRoute>} />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}