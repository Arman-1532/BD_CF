import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label = "Back" }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <button
            onClick={handleBack}
            className="fixed top-24 left-6 z-40 inline-flex items-center space-x-2 bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-lg border border-slate-200/80 transition hover:scale-105 cursor-pointer"
        >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>{label}</span>
        </button>
    );
}
