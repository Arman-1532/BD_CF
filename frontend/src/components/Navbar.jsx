import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, LogOut, User, PlusCircle, Search, ChevronDown, LayoutDashboard, Shield, Sparkles } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isAdmin = user && user.role === 'ADMIN';

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand Logo */}
                <Link 
                    to="/" 
                    className="flex items-center space-x-2.5 group"
                >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition duration-200">
                        <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                            BDCF
                        </span>
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">Crowdfunding</span>
                    </div>
                </Link>

                {/* Left/Center Nav Links */}
                <nav className="hidden md:flex items-center space-x-8">
                    <NavLink 
                        to="/" 
                        className={({ isActive }) => `text-sm font-semibold transition ${isActive ? 'text-emerald-600' : 'text-slate-700 hover:text-emerald-600'}`}
                    >
                        Home
                    </NavLink>
                    <NavLink 
                        to="/campaigns" 
                        className={({ isActive }) => `text-sm font-semibold transition ${isActive ? 'text-emerald-600' : 'text-slate-700 hover:text-emerald-600'}`}
                    >
                        Donate
                    </NavLink>
                    <button 
                        onClick={() => alert('BDCF is a trusted crowdfunding platform connecting donors with verified campaigners across Bangladesh.')} 
                        className="text-slate-700 hover:text-emerald-600 font-semibold text-sm transition cursor-pointer"
                    >
                        <span>About</span>
                    </button>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center space-x-4">
                    {/* Start a Fundraiser button (Hidden for Admins) */}
                    {!isAdmin && (
                        <Link
                            to="/create-campaign"
                            className="hidden sm:flex items-center space-x-1.5 border border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition"
                        >
                            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Start a Fundraiser</span>
                        </Link>
                    )}

                    {user ? (
                        <div className="flex items-center space-x-3">
                            {/* User Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <div 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-200 cursor-pointer transition select-none"
                                >
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                                        {user.profilePhotoUrl ? (
                                            <img src={user.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            user.displayName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <span className="text-xs font-bold text-slate-900 line-clamp-1">{user.displayName}</span>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </div>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-5 py-3 border-b border-slate-100">
                                            <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                        </div>

                                        <div className="py-1">
                                            {isAdmin ? (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="w-full px-5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition"
                                                >
                                                    <Shield className="w-4 h-4 text-amber-500" />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={`/profile/${user.userId}`}
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="w-full px-5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                                                    <span>My Dashboard / Feed</span>
                                                </Link>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 pt-1 mt-1">
                                            <button
                                                onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}
                                                className="w-full px-5 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2.5 transition cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Link
                                to="/login"
                                className="text-slate-700 hover:text-emerald-600 font-bold px-4 py-2 text-sm transition"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
