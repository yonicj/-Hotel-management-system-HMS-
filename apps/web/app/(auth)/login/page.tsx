'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@ehms/ui';
import { Hotel, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Submit login request
      const loginRes = await apiClient.post('/auth/login', { email, password });
      const loginData = loginRes.data?.data ?? loginRes.data;
      const { accessToken, refreshToken, user: rawUser } = loginData;

      if (!accessToken) {
        throw new Error('Authentication response did not return an access token.');
      }

      // 2. Immediately verify session with /api/auth/me to confirm fresh permissions & profile
      let confirmedUser = rawUser;
      try {
        const meRes = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const meData = meRes.data?.data ?? meRes.data;
        if (meData) {
          confirmedUser = meData;
        }
      } catch (meErr) {
        console.warn('Could not fetch /api/auth/me immediately; using login user payload', meErr);
      }

      // 3. Store authentication session
      setAuth(confirmedUser, accessToken, refreshToken);
      toast.success(`Welcome back, ${confirmedUser?.firstName || 'Staff'}!`, 'Signed In');

      // 4. Redirect to authenticated dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.error?.message ||
        'Authentication failed. Please verify your email and password.';
      setErrorMessage(msg);
      toast.error(msg, 'Sign In Error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-2 shadow-inner">
            <Hotel className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Grand HMS Ethiopian PMS
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise Hospitality Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Staff Sign In</h2>
            <p className="text-xs text-slate-500">
              Enter your hospitality account credentials to enter the system.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@grandhotel.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Hotel Shell</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helpers */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role Simulation Test Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@grandhotel.com', 'Admin@1234')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition"
              >
                <div className="font-semibold text-slate-800">Super Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@grandhotel.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('housekeeper@grandhotel.com', 'Admin@1234')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50/60 hover:border-sky-200 text-left transition"
              >
                <div className="font-semibold text-slate-800">Housekeeper</div>
                <div className="text-[10px] text-slate-500 truncate">housekeeper@grandhotel.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-500">
          🇪🇹 Addis Ababa, Ethiopia • Africa/Addis_Ababa (EAT UTC+3)
        </div>
      </div>
    </div>
  );
}
