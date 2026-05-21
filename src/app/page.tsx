'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { DEMO_ACCOUNTS, defaultRouteFor, DemoAccount } from '@/lib/permissions';

const ROLE_DOT: Record<string, string> = {
  ADMIN: 'bg-purple-500',
  CITY_MANAGER: 'bg-blue-500',
  SUPERVISOR: 'bg-emerald-500',
  DETAILER: 'bg-amber-500',
  INSPECTOR: 'bg-orange-500',
  SPECIALIST: 'bg-teal-500',
};

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const performLogin = async (loginPhone: string, loginOtp: string) => {
    const { data } = await authApi.verifyOtp(loginPhone, loginOtp, `admin-${Date.now()}`);
    const result = data.data || data;
    let staff = result.staff;
    if (!staff) {
      localStorage.setItem('admin_token', result.accessToken);
      const meRes = await authApi.me();
      staff = meRes.data?.data ?? meRes.data;
    }
    setAuth(staff, result.accessToken);
    router.push(defaultRouteFor(staff.role));
  };

  const handleSendOtp = async () => {
    setLoading(true); setError('');
    try {
      await authApi.sendOtp(phone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true); setError('');
    try { await performLogin(phone, otp); }
    catch (err: any) { setError(err.response?.data?.message || 'Invalid OTP'); }
    setLoading(false);
  };

  const handleDemoLogin = async (acc: DemoAccount) => {
    setDemoLoading(acc.role); setError('');
    try {
      await authApi.sendOtp(acc.phone);
      await performLogin(acc.phone, '123456');
    } catch (err: any) {
      setError(`${acc.label}: ${err.response?.data?.message || 'Login failed'}`);
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-autozy-dark relative overflow-hidden">
      {/* Background ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] bg-autozy-yellow/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative min-h-screen flex flex-col py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-autozy-yellow to-autozy-yellow-dark flex items-center justify-center shadow-glow-yellow text-autozy-dark">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none">AUTOZY</h1>
              <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">Admin Panel</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Sign in to manage daily car care operations across cities, staff, and customers.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md flex flex-col gap-6 animate-slide-up">
            {/* ── Manual Login ── */}
            <div className="bg-white rounded-2xl shadow-pop p-6 lg:p-7">
              <div className="mb-5 text-center">
                <h2 className="text-lg font-bold text-autozy-charcoal">Sign in</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter your registered mobile number</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-4 flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      className="w-full pl-12 pr-3 py-2.5 border border-surface-border rounded-lg text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 transition-all disabled:bg-surface-muted disabled:text-gray-500"
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="animate-slide-up">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">One-time password</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                      className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-base text-center tracking-[0.5em] font-semibold focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 transition-all"
                    />
                    <p className="text-2xs text-gray-400 mt-1.5">Sent to +91 {phone}</p>
                  </div>
                )}

                <button
                  onClick={otpSent ? handleVerify : handleSendOtp}
                  disabled={loading || (!otpSent && phone.length !== 10) || (otpSent && otp.length !== 6)}
                  className="w-full py-2.5 bg-gradient-to-r from-autozy-yellow to-autozy-yellow-dark text-autozy-dark font-bold rounded-lg hover:shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {loading ? 'Please wait…' : otpSent ? 'Verify & Sign in' : 'Send OTP'}
                </button>

                {otpSent && (
                  <button
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="w-full text-xs text-gray-500 hover:text-autozy-charcoal transition-colors"
                  >
                    ← Use a different number
                  </button>
                )}
              </div>
            </div>

            {/* ── Compact Demo Accounts ── */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-300">Quick Demo Access</span>
                <span className="px-2 py-0.5 bg-autozy-yellow/20 text-autozy-yellow border border-autozy-yellow/30 rounded text-2xs font-bold uppercase tracking-wider">
                  OTP: 123456
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isLoading = demoLoading === acc.role;
                  return (
                    <button
                      key={acc.phone}
                      onClick={() => handleDemoLogin(acc)}
                      disabled={demoLoading !== null}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 text-left"
                      title={acc.description}
                    >
                      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${ROLE_DOT[acc.role] || 'bg-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{acc.label}</p>
                        <p className="text-2xs text-gray-400 font-mono truncate">{acc.phone}</p>
                      </div>
                      {isLoading && (
                        <svg className="w-3 h-3 text-autozy-yellow animate-spin ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-2xs text-gray-500 mt-8">
          © {new Date().getFullYear()} Autozy · Daily car care. Done right.
        </p>
      </div>
    </div>
  );
}
