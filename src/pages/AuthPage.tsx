import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Lightbulb, Mail, Lock, User, ArrowRight, Sun, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

export default function AuthPage() {
  const {
    signIn,
    signUp,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    isLoading,
    error,
    clearError,
    authEvent,
    isAuthenticated,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Detect PASSWORD_RECOVERY event → switch to reset mode
  useEffect(() => {
    if (authEvent === "PASSWORD_RECOVERY") {
      setMode("reset");
      clearError();
    }
  }, [authEvent, clearError]);

  // Redirect once password is updated
  useEffect(() => {
    if (passwordChanged && isAuthenticated) {
      const returnPath = sessionStorage.getItem("auth_return_path");
      sessionStorage.removeItem("auth_return_path");
      window.location.href = returnPath || "/";
    }
  }, [passwordChanged, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else if (mode === "signup") {
        await signUp(email, password, nickname || "Explorer");
        setSignupSuccess(true);
        setMode("signin");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setResetSent(true);
      } else if (mode === "reset") {
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords don't match");
        }
        await updatePassword(newPassword);
        setPasswordChanged(true);
      }
    } catch {
      // error is already set in store or we handle inline
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    clearError();
    await signInWithOAuth(provider);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sun className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Suryopath
          </h1>
          <p className="text-sm text-muted mt-1">
            Your inner sanctuary for growth
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {/* Mode tabs (hidden for forgot/reset) */}
          {mode !== "forgot" && mode !== "reset" && (
            <div className="flex gap-1 mb-6 bg-muted/20 rounded-lg p-1">
              <button
                onClick={() => { setMode("signin"); clearError(); setSignupSuccess(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  mode === "signin"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("signup"); clearError(); setSignupSuccess(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  mode === "signup"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Back button for forgot/reset */}
          {(mode === "forgot" || mode === "reset") && !passwordChanged && (
            <button
              onClick={() => {
                setMode("signin");
                clearError();
                setResetSent(false);
              }}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4 transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          )}

          {/* Password changed — completion state */}
          {passwordChanged && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10">
                <CheckCircle className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  Password updated!
              </h3>
                <p className="text-sm text-muted mt-1">
                  Your password has been changed. Redirecting you…
                </p>
              </div>
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          )}

          {/* Forms */}
          {!passwordChanged && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nickname (signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Nickname
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Explorer"
                      className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* Email (shown for all modes except reset) */}
              {mode !== "reset" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required={mode !== "reset"}
                      className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* Password (signin / signup only) */}
              {(mode === "signin" || mode === "signup") && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                    />
                  </div>
                  {/* Forgot password link */}
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); clearError(); setResetSent(false); }}
                      className="text-xs text-muted hover:text-primary mt-1.5 transition-colors duration-150 underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              {/* New Password (reset mode) */}
              {mode === "reset" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Signup success banner */}
              {signupSuccess && (
                <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-accent">Check your inbox!</p>
                    <p className="text-xs text-accent/70 mt-0.5">
                      We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                    </p>
                  </div>
                </div>
              )}

              {/* Reset sent banner */}
              {resetSent && !error && (
                <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-accent">Reset link sent!</p>
                    <p className="text-xs text-accent/70 mt-0.5">
                      Check your email inbox for a link to reset your password.
                    </p>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "signin" && "Sign In"}
                    {mode === "signup" && "Create Account"}
                    {mode === "forgot" && "Send Reset Link"}
                    {mode === "reset" && "Set New Password"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OAuth divider & buttons (not shown during password reset flow) */}
          {!passwordChanged && mode !== "reset" && mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted">or continue with</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 py-2.5 px-6 bg-bg border border-border rounded-lg text-sm text-foreground font-medium hover:bg-muted/10 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SiGoogle className="w-4 h-4" />
                  Google
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Your thoughts are yours. Protected and private.
        </p>
      </div>
    </div>
  );
}
