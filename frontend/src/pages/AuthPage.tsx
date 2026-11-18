import React, { useState } from 'react';
import {
  Layers,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthPage: React.FC = () => {
  const { login, register, loginDemo } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await register(email, password, name);
      } else if (mode === 'forgot') {
        if (!resetCode) {
          // Request reset
          const res = await api.forgotPassword(email);
          setInfoMsg(res.message);
          setResetCode('123456'); // auto-fill demo code
        } else {
          // Confirm reset
          const res = await api.resetPassword({
            email,
            confirmation_code: resetCode,
            new_password: newPassword,
          });
          setInfoMsg(res.message);
          setMode('login');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none -top-40 -left-40"></div>
      <div className="absolute w-[500px] h-[500px] bg-accent-600/10 rounded-full blur-[120px] pointer-events-none -bottom-40 -right-40"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-500 to-accent-500 flex items-center justify-center mx-auto shadow-lg shadow-primary-500/25 text-white">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            AI Dataset Insight Platform
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' && 'Sign in to access your dataset intelligence dashboard'}
            {mode === 'register' && 'Create your free account to analyze and clean datasets'}
            {mode === 'forgot' && 'Reset your password with confirmation verification'}
          </p>
        </div>

        {/* Demo 1-Click Login Button */}
        {mode === 'login' && (
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              try {
                await loginDemo();
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full bg-gradient-to-r from-primary-600/20 via-accent-600/20 to-primary-600/20 hover:from-primary-600/30 hover:to-accent-600/30 border border-primary-500/40 text-primary-200 font-medium text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant Demo Sign In (1-Click)</span>
          </button>
        )}

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Taylor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-[11px] text-primary-400 hover:text-primary-300"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && resetCode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmation Code (Dev Code: 123456)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-lg shadow-primary-600/30 flex items-center justify-center space-x-2"
          >
            <span>
              {mode === 'login' && 'Sign In to Dashboard'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && (!resetCode ? 'Send Reset Code' : 'Update Password')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-primary-400 hover:text-primary-300 font-semibold"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-primary-400 hover:text-primary-300 font-semibold"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

