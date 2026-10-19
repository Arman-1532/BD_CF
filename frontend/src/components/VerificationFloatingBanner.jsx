import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VerificationFloatingBanner() {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    if (!user || user.role === 'ADMIN' || user.isVerified || dismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-3xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-400">Account Unverified</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">Please verify your account to publish trusted campaigns.</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
                <Link
                    to={`/profile/${user.userId}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
                >
                    Verify Now
                </Link>
                <button
                    onClick={() => setDismissed(true)}
                    className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
