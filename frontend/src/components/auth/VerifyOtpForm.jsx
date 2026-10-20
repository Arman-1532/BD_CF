import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyOtpForm() {
    const { login } = useAuth();
    const location = useLocation();
    
    const emailFromState = location.state?.email || '';
    const [email, setEmail] = useState(emailFromState);
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!email || !otp || otp.length < 6) {
            toast.error('Please enter a valid 6-digit verification code.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.detail || resData.error || 'Verification failed');
            }

            toast.success(resData.message || 'Email verified successfully!');
            login(resData.user, { accessToken: resData.accessToken, refreshToken: resData.refreshToken });
            const targetPath = resData.user?.role === 'ADMIN' ? '/admin' : `/profile/${resData.user.userId}`;
            setTimeout(() => {
                window.location.href = targetPath;
            }, 600);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast.error('Email address is missing.');
            return;
        }

        setIsResending(true);
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.detail || resData.error || 'Failed to resend code');
            }

            toast.success('A new verification code has been sent to your email.');
            setCountdown(60);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div>
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
            </div>

            <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
                Verify your email
            </h2>
            <p className="text-center text-sm text-slate-500 mb-8">
                We&apos;ve sent a 6-digit verification code to <span className="font-bold text-slate-700">{email || 'your email'}</span>. Enter the code below to activate your account.
            </p>

            <form className="space-y-5" onSubmit={handleVerify}>
                {!emailFromState && (
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400 transition"
                            placeholder="name@example.com"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">6-Digit OTP Code</label>
                    <input
                        type="text"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-[0.75em] font-black text-slate-900 placeholder-slate-300 transition"
                        placeholder="------"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || otp.length < 6}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition duration-300 disabled:opacity-50 text-sm tracking-wide uppercase cursor-pointer"
                    >
                        {isSubmitting ? 'Verifying...' : 'Verify Email'}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
                Didn&apos;t receive the code?{' '}
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className="font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed underline cursor-pointer"
                >
                    {countdown > 0 ? `Resend in ${countdown}s` : (isResending ? 'Sending...' : 'Resend Code')}
                </button>
            </div>

            <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </Link>
            </div>
        </div>
    );
}
