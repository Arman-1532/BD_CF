import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import VerifyOtpForm from './components/auth/VerifyOtpForm';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateCampaignPage from './pages/CreateCampaignPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import CampaignsPage from './pages/CampaignsPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache
            refetchOnWindowFocus: false,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
                <BrowserRouter>
                    <Routes>
                        <Route element={<RootLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/campaigns" element={<CampaignsPage />} />
                            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
                            <Route path="/profile/:userId" element={<UserDashboard />} />
                            <Route path="/create-campaign" element={<CreateCampaignPage />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Route>
                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<LoginForm />} />
                            <Route path="/signup" element={<SignupForm />} />
                            <Route path="/verify-otp" element={<VerifyOtpForm />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
