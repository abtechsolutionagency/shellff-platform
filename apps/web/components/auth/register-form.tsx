"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

const USER_TYPES = [
  { value: "LISTENER", label: "Listener" },
  { value: "CREATOR", label: "Creator" },
];

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export function RegisterForm() {
  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    firstName: "",
    lastName: "",
    userType: "LISTENER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUserTypeMenuOpen, setIsUserTypeMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }

    return true;
  };

  const redirectAfterAuth = async () => {
    const nextSession = await update();
    const userType = (nextSession?.user as any)?.userType?.toUpperCase();
    const targetRoute = userType === "ADMIN" ? "/admin" : "/dashboard";
    router.replace(targetRoute);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: formData.userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create account");
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        await redirectAfterAuth();
        return;
      }

      router.push("/auth/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUserType = (type: string) => {
    handleChange("userType", type);
    setIsUserTypeMenuOpen(false);
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
              style={{ background: "linear-gradient(to right, #9B5DE5, #00F5D4)" }}
            />
            <p className="text-zinc-300 mt-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Create your account to start your music journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-zinc-300 mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  First name
                </label>
                <InputField
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(event) => handleChange("firstName", event.target.value)}
                  disabled={isLoading}
                  placeholder="Jane"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-zinc-300 mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Last name
                </label>
                <InputField
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => handleChange("lastName", event.target.value)}
                  disabled={isLoading}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-zinc-300 mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Username
              </label>
              <InputField
                id="username"
                type="text"
                value={formData.username}
                onChange={(event) => handleChange("username", event.target.value)}
                disabled={isLoading}
                placeholder="shellff_fan"
                required
              />
            </div>

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
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                disabled={isLoading}
                placeholder="user@shellff.com"
                required
              />
            </div>

            <div className="relative">
              <label
                htmlFor="userType"
                className="block text-zinc-300 mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Account type
              </label>
              <button
                type="button"
                onClick={() => setIsUserTypeMenuOpen((open) => !open)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-left text-white"
                style={{ fontFamily: "Inter, sans-serif" }}
                disabled={isLoading}
              >
                <span>{USER_TYPES.find((option) => option.value === formData.userType)?.label}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isUserTypeMenuOpen && (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg">
                  {USER_TYPES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectUserType(option.value)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      disabled={isLoading}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
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
                  value={formData.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  disabled={isLoading}
                  placeholder="Create a password"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-zinc-300 mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Confirm password
              </label>
              <div className="relative">
                <InputField
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(event) => handleChange("confirmPassword", event.target.value)}
                  disabled={isLoading}
                  placeholder="Repeat your password"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </PrimaryButton>

            <div className="text-center">
              <span className="text-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>
                Already have an account?
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                disabled={isLoading}
                className="ml-1 transition-colors duration-300"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: "500", color: "#9B5DE5" }}
                onMouseEnter={(event) => {
                  (event.target as HTMLButtonElement).style.color = "#00F5D4";
                }}
                onMouseLeave={(event) => {
                  (event.target as HTMLButtonElement).style.color = "#9B5DE5";
                }}
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>

      {isUserTypeMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-0"
          onClick={() => setIsUserTypeMenuOpen(false)}
        >
          <span className="sr-only">Close account type menu</span>
        </button>
      )}
    </div>
  );
}
