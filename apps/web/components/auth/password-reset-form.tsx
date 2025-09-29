
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { ArrowLeft, Key, Eye, EyeOff, Clock } from "lucide-react";

interface PasswordResetFormProps {
  onBackToLogin?: () => void;
}

export function PasswordResetForm({ onBackToLogin }: PasswordResetFormProps) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          step: "request_reset"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      setMaskedEmail(data.maskedEmail);
      setStep('reset');
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otpCode,
          newPassword,
          step: "verify_and_reset"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Success - redirect to login
      router.push("/auth/login?message=password_reset_success");

    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          step: "request_reset"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch (error: any) {
      setError(error.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: '#121212' }}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-teal-400/10"></div>
      </div>
      
      {/* Password Reset Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          
          {/* Back Button */}
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={() => {
                if (step === 'reset') {
                  setStep('email');
                } else if (onBackToLogin) {
                  onBackToLogin();
                }
              }}
              className="flex items-center text-zinc-400 hover:text-zinc-300 transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-teal-400 rounded-full mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-white mb-2" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
              {step === 'email' ? 'Reset Password' : 'Create New Password'}
            </h1>
            <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              {step === 'email' 
                ? 'Enter your email to receive a reset code'
                : `Enter the code sent to ${maskedEmail}`
              }
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-zinc-300 mb-2" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Email Address
                </label>
                <InputField
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? "Sending Code..." : "Send Reset Code"}
              </PrimaryButton>
            </form>
          )}

          {/* Step 2: Reset Form */}
          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div>
                <label htmlFor="otpCode" className="block text-zinc-300 mb-2" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  6-Digit Code
                </label>
                <InputField
                  id="otpCode"
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtpCode(value);
                  }}
                  disabled={isLoading}
                  required
                  className="text-center text-xl font-mono tracking-wider"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-zinc-300 mb-2" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  New Password
                </label>
                <div className="relative">
                  <InputField
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-zinc-300 mb-2" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <InputField
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Resend Code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <div className="flex items-center justify-center text-zinc-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Resend code in {countdown}s</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm transition-colors duration-300"
                    style={{ 
                      fontFamily: 'Inter, sans-serif', 
                      fontWeight: '500',
                      color: '#9B5DE5'
                    }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.color = '#00F5D4'}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = '#9B5DE5'}
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  {error}
                </div>
              )}

              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </PrimaryButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
