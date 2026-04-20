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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-autozy-yellow to-autozy-yellow-dark flex items-center justify-center shadow-glow-yellow">
              <span className="text-autozy-dark font-extrabold text-xl">A</span>
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
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up">
            {/* ── Demo Accounts ── */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-pop p-6 lg:p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-autozy-charcoal">Try a demo account</h2>
                  <p className="text-xs text-gray-500 mt-0.5">One-click sign-in — explore each role's tailored dashboard</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-2xs font-bold uppercase tracking-wider">
                  Demo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isLoading = demoLoading === acc.role;
                  return (
                    <button
                      key={acc.phone}
                      onClick={() => handleDemoLogin(acc)}
                      disabled={demoLoading !== null}
                      className="text-left p-4 border border-surface-border rounded-xl hover:border-autozy-yellow hover:bg-autozy-yellow/5 hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full ${ROLE_DOT[acc.role] || 'bg-gray-400'}`} />
                        <span className="font-semibold text-sm text-autozy-charcoal">{acc.label}</span>
                        {acc.city && (
                          <span className="ml-auto text-2xs text-gray-400 uppercase tracking-wider font-medium">{acc.city}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.4em]">{acc.description}</p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-surface-border/60">
                        <code className="text-2xs text-gray-400 font-mono">{acc.phone}</code>
                        <span className="text-xs font-semibold text-autozy-blue group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          {isLoading ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Signing in
                            </>
                          ) : (
                            <>Sign in <span aria-hidden>→</span></>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 px-3 py-2.5 bg-surface-muted rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-2xs text-gray-500 leading-relaxed">
                  Demo accounts use OTP <code className="px-1 py-0.5 bg-white border border-surface-border rounded font-mono">123456</code>.
                  Each role sees only the modules they have permission to access.
                </p>
              </div>
            </div>

            {/* ── Manual Login ── */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-pop p-6 lg:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-autozy-charcoal">Sign in with mobile</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter your registered phone number</p>
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
          </div>
        </div>

        <p className="text-center text-2xs text-gray-500 mt-8">
          © {new Date().getFullYear()} Autozy · Daily car care. Done right.
        </p>
      </div>
    </div>
  );
}
