
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { changePassword, type ChangePasswordResponse } from '@/lib/profile-client';

export function getPasswordChangeSuccessMessage(result?: ChangePasswordResponse | null): string {
  return result?.message ?? 'Password changed successfully';
}

export function getPasswordChangeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to change password';
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export function PasswordChange() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<
    { type: 'success' | 'error'; message: string }
  | null
  >(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z\d]/.test(password)) score++;
    else feedback.push('Include special characters');

    return { score, feedback };
  };

  const passwordStrength = validatePassword(formData.newPassword);
  const isPasswordStrong = passwordStrength.score >= 4;
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const newErrors: string[] = [];
    setStatusMessage(null);

    if (!formData.currentPassword) {
      newErrors.push('Current password is required');
    }

    if (!formData.newPassword) {
      newErrors.push('New password is required');
    } else if (!isPasswordStrong) {
      newErrors.push('Password does not meet security requirements');
    }

    if (!formData.confirmPassword) {
      newErrors.push('Please confirm your new password');
    } else if (!passwordsMatch) {
      newErrors.push('New passwords do not match');
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.push('New password must be different from current password');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      toast({
        title: 'Success',
        description: getPasswordChangeSuccessMessage(result),
      });

      setStatusMessage({
        type: 'success',
        message: getPasswordChangeSuccessMessage(result),
      });

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password change error:', error);
      const message = getPasswordChangeErrorMessage(error);
      setStatusMessage({
        type: 'error',
        message,
      });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'text-red-500';
    if (score < 3) return 'text-yellow-500';
    if (score < 4) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 3) return 'Fair';
    if (score < 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {statusMessage && (
              <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'}>
                <AlertTitle className="flex items-center gap-2">
                  {statusMessage.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {statusMessage.type === 'error' ? 'Password update failed' : 'Password updated'}
                </AlertTitle>
                <AlertDescription>{statusMessage.message}</AlertDescription>
              </Alert>
            )}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          passwordStrength.score < 2 ? 'bg-red-500' :
                          passwordStrength.score < 3 ? 'bg-yellow-500' :
                          passwordStrength.score < 4 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getStrengthColor(passwordStrength.score)}`}>
                      {getStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {passwordStrength.feedback.map((tip, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {formData.confirmPassword && (
                <div className={`mt-1 flex items-center gap-2 text-sm ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  <CheckCircle className={`h-4 w-4 ${passwordsMatch ? '' : 'opacity-30'}`} />
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || !isPasswordStrong || !passwordsMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
