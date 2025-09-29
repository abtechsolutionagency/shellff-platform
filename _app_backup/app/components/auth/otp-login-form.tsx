
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { Mail, ArrowLeft, Clock } from "lucide-react";

interface OtpLoginFormProps {
  onBackToLogin?: () => void;
}

export function OtpLoginForm({ onBackToLogin }: OtpLoginFormProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
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
      const response = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          step: "request_otp"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setMaskedEmail(data.maskedEmail);
      setStep('otp');
      setCountdown(60); // 60 second cooldown
      
      // Start countdown timer
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otpCode,
          step: "verify_otp"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      // Use NextAuth signIn with the email to create session
      const result = await signIn("credentials", {
        email,
        password: "otp_verified", // Special flag for OTP login
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Login failed. Please try again.");
      }

    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          step: "request_otp"
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
        setError(data.error || "Failed to resend OTP");
      }
    } catch (error: any) {
      setError(error.message || "Failed to resend OTP");
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
      
      {/* OTP Login Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          
          {/* Back Button */}
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={() => {
                if (step === 'otp') {
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
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-white mb-2" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
              {step === 'email' ? 'Login with Email' : 'Enter Verification Code'}
            </h1>
            <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              {step === 'email' 
                ? 'We\'ll send you a secure login code'
                : `Code sent to ${maskedEmail}`
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

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  {error}
                </div>
              )}

              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? "Sending Code..." : "Send Login Code"}
              </PrimaryButton>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
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
                  className="text-center text-2xl font-mono tracking-widest"
                />
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
                    onClick={handleResendOtp}
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

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  {error}
                </div>
              )}

              <PrimaryButton type="submit" disabled={isLoading || otpCode.length !== 6}>
                {isLoading ? "Verifying..." : "Verify & Login"}
              </PrimaryButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
