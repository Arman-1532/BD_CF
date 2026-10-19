import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake } from 'lucide-react';

export default function AuthLayout() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect authenticated users away from login/signup
    useEffect(() => {
        if (!loading && user) {
            const origin = location.state?.from?.pathname || '/';
            navigate(origin, { replace: true });
        }
    }, [user, loading, navigate, location]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Professional Home Link */}
            <div className="absolute top-6 left-6 sm:left-12">
                <Link to="/" className="flex items-center space-x-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                        <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                        BDCF
                    </span>
                </Link>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-8 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
