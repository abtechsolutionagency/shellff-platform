"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        const nextSession = await update();
        const userType = (nextSession?.user as any)?.userType?.toUpperCase();
        const targetRoute = userType === "ADMIN" ? "/admin" : "/dashboard";
        router.replace(targetRoute);
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#121212" }}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-teal-400/10" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1
              className="text-white mb-2"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: "700",
                fontSize: "2.25rem",
                lineHeight: "2.5rem",
              }}
            >
              Shellff
            </h1>
            <div
              className="w-16 h-1 rounded-full mx-auto"
              style={{
                background: "linear-gradient(to right, #9B5DE5, #00F5D4)",
              }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-zinc-300 mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Email
              </label>
              <InputField
                id="email"
                type="email"
                placeholder="user@shellff.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-zinc-300 mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <InputField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/auth/password-reset")}
                  disabled={isLoading}
                  className="text-sm transition-colors duration-300 bg-transparent border-none cursor-pointer"
                  style={{ fontFamily: "Inter, sans-serif", color: "#9B5DE5" }}
                  onMouseEnter={(event) => {
                    (event.target as HTMLButtonElement).style.color = "#00F5D4";
                  }}
                  onMouseLeave={(event) => {
                    (event.target as HTMLButtonElement).style.color = "#9B5DE5";
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Login"}
            </PrimaryButton>

            <div className="text-center">
              <span className="text-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>
                Or
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth/otp-login")}
                disabled={isLoading}
                className="transition-colors duration-300 bg-transparent border-none cursor-pointer"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "500",
                  color: "#9B5DE5",
                }}
                onMouseEnter={(event) => {
                  (event.target as HTMLButtonElement).style.color = "#00F5D4";
                }}
                onMouseLeave={(event) => {
                  (event.target as HTMLButtonElement).style.color = "#9B5DE5";
                }}
              >
                Login with Email Code
              </button>
            </div>

            <div className="text-center pt-4 border-t border-zinc-700">
              <span className="text-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>
                Don&apos;t have an account?
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth/register")}
                disabled={isLoading}
                className="transition-colors duration-300 bg-transparent border-none cursor-pointer"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "500",
                  color: "#9B5DE5",
                }}
                onMouseEnter={(event) => {
                  (event.target as HTMLButtonElement).style.color = "#00F5D4";
                }}
                onMouseLeave={(event) => {
                  (event.target as HTMLButtonElement).style.color = "#9B5DE5";
                }}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
