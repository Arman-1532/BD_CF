import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* Column 1: Brand & Bio */}
                <div className="space-y-4">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                            <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">BDCF</span>
                    </Link>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        BDCF is Bangladesh's trusted crowdfunding and non-profit platform empowering communities and transparent charitable giving.
                    </p>
                </div>

                {/* Column 2: Quick Links */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/" className="hover:text-emerald-400 transition">Home</Link></li>
                        <li><Link to="/campaigns" className="hover:text-emerald-400 transition">Explore Campaigns</Link></li>
                        <li><Link to="/create-campaign" className="hover:text-emerald-400 transition">Start a Fundraiser</Link></li>
                    </ul>
                </div>

                {/* Column 3: Causes & Categories */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Causes & Categories</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/campaigns" className="hover:text-emerald-400 transition">Medical Treatment</Link></li>
                        <li><Link to="/campaigns" className="hover:text-emerald-400 transition">Disaster Relief</Link></li>
                        <li><Link to="/campaigns" className="hover:text-emerald-400 transition">Education Support</Link></li>
                        <li><Link to="/campaigns" className="hover:text-emerald-400 transition">Community Welfare</Link></li>
                    </ul>
                </div>

                {/* Column 4: Trust & Security */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Security</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Verified campaigner identity tracking, SSL encrypted contributions, and rigorous moderation.
                    </p>
                    <div className="pt-2 text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} BDCF. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
