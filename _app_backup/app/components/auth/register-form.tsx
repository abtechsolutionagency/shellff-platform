
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    firstName: "",
    lastName: "",
    userType: "LISTENER"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(data.error || "Failed to create account");
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // If auto-signin fails, redirect to login
        router.push("/auth/login");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
      console.error("Registration error:", error);
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
      
      {/* Register Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-white mb-2" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: '700',
                  fontSize: '2.25rem',
                  lineHeight: '2.5rem'
                }}>
              Shellff
            </h1>
            <div className="w-16 h-1 rounded-full mx-auto"
                 style={{ background: 'linear-gradient(to right, #9B5DE5, #00F5D4)' }}></div>
            <p className="text-zinc-300 mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Create your account to start your music journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-zinc-300 mb-2" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  First Name
                </label>
                <InputField
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-zinc-300 mb-2" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Last Name
                </label>
                <InputField
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-zinc-300 mb-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                Username
              </label>
              <InputField
                id="username"
                type="text"
                placeholder="musiclover"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-zinc-300 mb-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                Email
              </label>
              <InputField
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* User Type */}
            <div>
              <label htmlFor="userType" className="block text-zinc-300 mb-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                I am a
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl 
                           text-white text-left flex justify-between items-center
                           focus:outline-none transition-all duration-300 hover:border-zinc-600 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    borderColor: '#52525b'
                  }}
                  onFocus={(e) => {
                    if (!isLoading) {
                      e.target.style.borderColor = '#9B5DE5';
                      e.target.style.boxShadow = '0 0 0 2px rgba(155, 93, 229, 0.2)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#52525b';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <span>{formData.userType === "LISTENER" ? "Listener" : "Creator"}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showUserTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg z-50">
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("userType", "LISTENER");
                        setShowUserTypeDropdown(false);
                      }}
                      disabled={isLoading}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 transition-colors duration-200 rounded-t-xl"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Listener
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("userType", "CREATOR");
                        setShowUserTypeDropdown(false);
                      }}
                      disabled={isLoading}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 transition-colors duration-200 rounded-b-xl"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Creator
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-zinc-300 mb-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                Password
              </label>
              <div className="relative">
                <InputField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-zinc-300 mb-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                Confirm Password
              </label>
              <div className="relative">
                <InputField
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
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

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                {error}
              </div>
            )}

            {/* Register Button */}
            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </PrimaryButton>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                disabled={isLoading}
                className="transition-colors duration-300 bg-transparent border-none cursor-pointer"
                style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: '500',
                  color: '#9B5DE5'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.color = '#00F5D4'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = '#9B5DE5'}>
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showUserTypeDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserTypeDropdown(false)}
        />
      )}
    </div>
  );
}
