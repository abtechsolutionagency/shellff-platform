"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { Mail, ArrowLeft, Clock } from "lucide-react";

interface OtpLoginFormProps {
  onBackToLogin?: () => void;
}

type Step = "email" | "otp";

export function OtpLoginForm({ onBackToLogin }: OtpLoginFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }

    countdownTimer.current = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          if (countdownTimer.current) {
            clearInterval(countdownTimer.current);
            countdownTimer.current = null;
          }
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  };

  const redirectAfterAuth = async () => {
    const nextSession = await update();
    const userType = (nextSession?.user as any)?.userType?.toUpperCase();
    const targetRoute = userType === "ADMIN" ? "/admin" : "/dashboard";
    router.replace(targetRoute);
    router.refresh();
  };

  const requestOtp = async (targetEmail: string) => {
    const response = await fetch("/api/auth/otp-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, step: "request_otp" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to send login code");
    }

    setMaskedEmail(data.maskedEmail ?? "");
    setStep("otp");
    startCountdown();
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await requestOtp(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode, step: "verify_otp" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Invalid login code");
      }

      const result = await signIn("credentials", {
        email,
        password: "otp_verified",
        redirect: false,
      });

      if (result?.ok) {
        await redirectAfterAuth();
        return;
      }

      setError("Login failed. Please try again.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestOtp(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to resend code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const otpDisabled = isLoading || otpCode.length !== 6;

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
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={onBackToLogin ?? (() => router.push("/auth/login"))}
              className="text-zinc-400 hover:text-white transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Back
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-teal-400 mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1
              className="text-white mb-2"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: "700", fontSize: "1.5rem" }}
            >
              {step === "email" ? "Login with email" : "Enter verification code"}
            </h1>
            <p className="text-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>
              {step === "email" ? "We will send a secure login code" : `Code sent to ${maskedEmail}`}
            </p>
          </div>

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-zinc-300 mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Email address
                </label>
                <InputField
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  {error}
                </div>
              )}

              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? "Sending code..." : "Send login code"}
              </PrimaryButton>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-zinc-300 mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  6-digit code
                </label>
                <InputField
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                    setOtpCode(value);
                  }}
                  disabled={isLoading}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  required
                />
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <div className="flex items-center justify-center text-zinc-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Resend code in {countdown}s</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm transition-colors duration-300"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: "500", color: "#9B5DE5" }}
                    onMouseEnter={(event) => {
                      (event.target as HTMLButtonElement).style.color = "#00F5D4";
                    }}
                    onMouseLeave={(event) => {
                      (event.target as HTMLButtonElement).style.color = "#9B5DE5";
                    }}
                  >
                    Resend code
                  </button>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  {error}
                </div>
              )}

              <PrimaryButton type="submit" disabled={otpDisabled}>
                {isLoading ? "Verifying..." : "Verify & login"}
              </PrimaryButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
