import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Clock, CheckCircle, XCircle, AlertCircle, Heart, Calendar, Sparkles, Globe, ShieldCheck, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function UserDashboard() {
    const { userId: routeUserId } = useParams();
    const { user, accessToken, refreshAuthToken, updateLocalUser } = useAuth();
    const navigate = useNavigate();
    const targetUserId = routeUserId || (user ? user.userId : null);

    const [profileData, setProfileData] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!targetUserId) {
            navigate('/');
            return;
        }
        fetchProfileAndCampaigns();
    }, [targetUserId]);

    const fetchProfileAndCampaigns = async () => {
        setLoading(true);
        setError('');
        try {
            let token = accessToken;
            let res = await fetch(`/api/campaigns/profile/${targetUserId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if ((res.status === 401 || res.status === 403) && token) {
                token = await refreshAuthToken();
                res = await fetch(`/api/campaigns/profile/${targetUserId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');

            setProfileData(data.profile);
            setCampaigns(data.campaigns);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [updatingPhoto, setUpdatingPhoto] = useState(false);
    const [verificationDocInput, setVerificationDocInput] = useState('');
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        if (!verificationDocInput.trim()) return;

        setSubmittingVerification(true);
        try {
            const res = await fetch('/api/auth/verify-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ verificationDoc: verificationDocInput.trim() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit verification');

            alert('Verification document submitted successfully!');
            setVerificationDocInput('');
            setVerificationModalOpen(false);
            fetchProfileAndCampaigns();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingVerification(false);
        }
    };

    const handlePhotoFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image file size must be less than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPendingPhotoBase64(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const [pendingPhotoBase64, setPendingPhotoBase64] = useState(null);

    const handleConfirmPhotoUpload = async () => {
        if (!pendingPhotoBase64) return;
        setUpdatingPhoto(true);
        try {
            let token = accessToken;
            let res = await fetch('/api/auth/update-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ profilePhotoUrl: pendingPhotoBase64 })
            });

            if ((res.status === 401 || res.status === 403) && token) {
                token = await refreshAuthToken();
                res = await fetch('/api/auth/update-photo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ profilePhotoUrl: pendingPhotoBase64 })
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile picture');

            toast.success('Profile picture updated successfully!');
            if (updateLocalUser) {
                updateLocalUser({ profilePhotoUrl: pendingPhotoBase64 });
            }
            setPendingPhotoBase64(null);
            setPhotoModalOpen(false);
            fetchProfileAndCampaigns();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdatingPhoto(false);
        }
    };

    const totalRaised = campaigns.reduce((acc, c) => acc + c.currentAmount, 0);
    const isOwnProfile = user && profileData && user.userId === profileData.userId;

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-20">
            {/* Professional Profile Header */}
            <div className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8 shadow-xs">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center space-x-5">
                            <div className="relative flex-shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-600 text-white text-3xl font-black flex items-center justify-center shadow-lg shadow-emerald-600/20 overflow-hidden">
                                    {profileData?.profilePhotoUrl ? (
                                        <img src={profileData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        profileData?.displayName?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setPhotoModalOpen(true)}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition cursor-pointer border-2 border-white"
                                        title="Edit Profile Picture"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    {profileData?.isVerified ? (
                                        <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 flex items-center space-x-1">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>Verified Campaigner</span>
                                        </span>
                                    ) : (
                                        <span className="bg-amber-50 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 flex items-center space-x-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Unverified</span>
                                        </span>
                                    )}
                                    {profileData?.role === 'ADMIN' && (
                                        <span className="bg-amber-50 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 flex items-center space-x-1">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>Admin</span>
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                    <span>{profileData?.displayName || 'Loading...'}</span>
                                </h1>
                                <p className="text-slate-600 text-sm mt-2 max-w-2xl leading-relaxed">
                                    {profileData?.bio || ''}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Summary Card */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 flex items-center space-x-6 w-full md:w-auto shadow-2xs">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Fundraisers</p>
                                <p className="text-2xl font-black text-slate-900 mt-0.5">{campaigns.length}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Raised</p>
                                <p className="text-2xl font-black text-emerald-600 mt-0.5">৳{totalRaised.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Feed Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fundraiser Campaigns</h2>
                        <p className="text-sm text-slate-500 mt-0.5">All public and draft campaigns managed by {profileData?.displayName || 'this user'}.</p>
                    </div>
                    {isOwnProfile && (
                        <Link
                            to="/create-campaign"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer"
                        >
                            <span>+ Start New Fundraiser</span>
                        </Link>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse h-80"></div>
                        ))}
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-xs">
                        <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No fundraisers created yet</h3>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">When campaigns are started, they will appear here with live progress tracking.</p>
                        {isOwnProfile && (
                            <Link
                                to="/create-campaign"
                                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20"
                            >
                                Start Your First Fundraiser
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map(camp => {
                            const fundedPct = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
                            return (
                                <Link
                                    key={camp.id}
                                    to={`/campaigns/${camp.id}`}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1"
                                >
                                    <div>
                                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                            <img
                                                src={`data:${camp.imageType};base64,${camp.imageData}`}
                                                alt={camp.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                            />
                                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-emerald-800 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                                                {camp.category}
                                            </div>
                                            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                                                {camp.status}
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-3">
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition leading-snug line-clamp-2">
                                                {camp.title}
                                            </h3>
                                            <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                                                {camp.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="px-6 pb-6 pt-0 space-y-3">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-baseline text-xs font-bold">
                                                <span className="text-emerald-700 text-sm font-black">৳{camp.currentAmount.toLocaleString()}</span>
                                                <span className="text-slate-400">{fundedPct}% raised</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${fundedPct}%` }}></div>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                                                <span>Goal: ৳{camp.targetAmount.toLocaleString()}</span>
                                                <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* PROFILE PHOTO MODAL */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Upload Profile Picture</h3>
                            </div>
                            <button
                                onClick={() => { setPhotoModalOpen(false); setPendingPhotoBase64(null); }}
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoFileChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition cursor-pointer"
                                />
                            </div>

                            {pendingPhotoBase64 && (
                                <div className="flex justify-center pt-2">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                        <img src={pendingPhotoBase64} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setPhotoModalOpen(false); setPendingPhotoBase64(null); }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-2xl text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmPhotoUpload}
                                    disabled={!pendingPhotoBase64 || updatingPhoto}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                                >
                                    {updatingPhoto ? 'Uploading...' : 'Confirm Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
