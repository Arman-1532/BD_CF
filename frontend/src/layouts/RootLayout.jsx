import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerificationFloatingBanner from '../components/VerificationFloatingBanner';

export default function RootLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 justify-between relative">
            <div>
                <Navbar />
                <main>
                    <Outlet />
                </main>
            </div>
            <Footer />
            <VerificationFloatingBanner />
        </div>
    );
}
