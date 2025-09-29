
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { ArrowLeft, Mail, CheckCircle, Clock } from "lucide-react";

interface EmailVerificationFormProps {
  userId?: string;
  email?: string;
  onVerificationComplete?: () => void;
  onBackToLogin?: () => void;
}

export function EmailVerificationForm({ 
  userId, 
  email, 
  onVerificationComplete,
  onBackToLogin 
}: EmailVerificationFormProps) {
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // Auto-send verification email on mount if userId is provided
  useEffect(() => {
    if (userId && !success) {
      sendVerificationCode();
    }
  }, [userId]);

  const sendVerificationCode = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          step: "send_verification"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

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
      setError(error.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          otpCode,
          step: "verify_code"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify email");
      }

      setSuccess(true);
      
      // Call completion callback if provided
      if (onVerificationComplete) {
        setTimeout(onVerificationComplete, 2000);
      } else {
        // Default: redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login?message=email_verified");
        }, 2000);
      }

    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || !userId) return;
    await sendVerificationCode();
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" 
           style={{ backgroundColor: '#121212' }}>
        <div className="relative w-full max-w-md z-10">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-white mb-2" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: '700',
                  fontSize: '1.5rem'
                }}>
              Email Verified!
            </h1>
            <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your email has been successfully verified. You will be redirected shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: '#121212' }}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-teal-400/10"></div>
      </div>
      
      {/* Email Verification Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          
          {/* Back Button */}
          {onBackToLogin && (
            <div className="flex items-center mb-6">
              <button
                type="button"
                onClick={onBackToLogin}
                className="flex items-center text-zinc-400 hover:text-zinc-300 transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </button>
            </div>
          )}
          
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
              Verify Your Email
            </h1>
            <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              {email 
                ? `We sent a verification code to ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`
                : 'Enter the verification code sent to your email'
              }
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div>
              <label htmlFor="otpCode" className="block text-zinc-300 mb-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                6-Digit Verification Code
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
                  onClick={handleResendCode}
                  disabled={isLoading || !userId}
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
              {isLoading ? "Verifying..." : "Verify Email"}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
}
