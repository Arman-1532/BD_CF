import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Heart, ShieldCheck, Share2, Clock, MessageSquare, Send, Trash2, Check, Calendar, Info, Flag, AlertCircle, MapPin } from 'lucide-react';
import BackButton from '../components/BackButton';

export default function CampaignDetailPage() {
    const { id: campaignId } = useParams();
    const navigate = useNavigate();
    const { user, accessToken, refreshAuthToken } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('story');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [allDonationsModalOpen, setAllDonationsModalOpen] = useState(false);
    const [donateModalOpen, setDonateModalOpen] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [donorNameInput, setDonorNameInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [donating, setDonating] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!campaignId) {
            navigate('/');
            return;
        }
        fetchCampaignDetailAndComments();
    }, [campaignId]);

    const fetchCampaignDetailAndComments = async () => {
        setLoading(true);
        setError('');
        try {
            const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
            const [campRes, commentsRes] = await Promise.all([
                fetch(`/api/campaigns/${campaignId}`, { headers }),
                fetch(`/api/comments/${campaignId}`)
            ]);

            const campData = await campRes.json();
            const commentsData = await commentsRes.json();

            if (!campRes.ok || !commentsRes.ok) {
                throw new Error(campData.error || commentsData.error || 'Failed to fetch campaign data');
            }

            setCampaign(campData.campaign);
            setComments(commentsData.comments || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setCommentSubmitting(true);
        try {
            let token = accessToken;
            let res = await fetch(`/api/comments/${campaignId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ content: newComment })
            });

            if ((res.status === 401 || res.status === 403) && token) {
                token = await refreshAuthToken();
                res = await fetch(`/api/comments/${campaignId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ content: newComment })
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to post comment');

            setComments(prev => [data.comment, ...prev]);
            setNewComment('');
        } catch (err) {
            alert(err.message);
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete comment');

            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDonateSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(donationAmount);
        if (!amt || isNaN(amt) || amt <= 0) {
            alert('Please enter a valid donation amount');
            return;
        }

        setDonating(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/donate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                },
                body: JSON.stringify({
                    amount: amt,
                    donorName: donorNameInput.trim() || (user ? user.displayName : 'Guest Donor'),
                    isAnonymous
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to process donation');

            alert('Thank you! Your donation was processed successfully.');
            setDonateModalOpen(false);
            setDonationAmount('');
            setDonorNameInput('');
            setIsAnonymous(false);
            fetchCampaignDetailAndComments();
        } catch (err) {
            alert(err.message);
        } finally {
            setDonating(false);
        }
    };
    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!reportReason.trim()) return;

        try {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                },
                body: JSON.stringify({ campaignId, reason: reportReason.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to report campaign');

            alert(data.message || 'Campaign reported successfully.');
            setReportModalOpen(false);
            setReportReason('');
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading campaign details...</p>
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col items-center justify-center p-4">
                <div className="bg-white border border-slate-200/80 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Campaign</h2>
                    <p className="text-slate-500 text-sm mb-6">{error || 'Campaign not found'}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Campaigns</span>
                    </Link>
                </div>
            </div>
        );
    }

    const progress = Math.min(100, Math.round((campaign.currentAmount / campaign.targetAmount) * 100));
    let daysRemaining = null;
    if (campaign.endDate) {
        const diffTime = new Date(campaign.endDate) - new Date();
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {user?.role === 'ADMIN' && campaign.status === 'PENDING' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Admin Verification Mode</h4>
                                <p className="text-xs text-amber-700">Review the details and attached verification proof below before making a decision.</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${accessToken}`
                                            },
                                            body: JSON.stringify({ status: 'APPROVED' })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || 'Failed to approve');
                                        alert('Campaign approved successfully!');
                                        navigate('/admin');
                                    } catch (err) {
                                        alert(err.message);
                                    }
                                }}
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
                            >
                                Approve Campaign
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${accessToken}`
                                            },
                                            body: JSON.stringify({ status: 'REJECTED' })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || 'Failed to reject');
                                        alert('Campaign rejected.');
                                        navigate('/admin');
                                    } catch (err) {
                                        alert(err.message);
                                    }
                                }}
                                className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-700 font-bold px-5 py-2.5 rounded-xl text-xs transition border border-red-200 cursor-pointer"
                            >
                                Reject Campaign
                            </button>
                        </div>
                    </div>
                )}

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Main Column (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Unverified Organizer Warning Notice */}
                        {!campaign.createdBy?.isVerified && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3 text-amber-800">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div className="text-xs sm:text-sm">
                                    <strong className="font-bold">Trust Notice:</strong> This campaign is organized by an <span className="underline font-semibold">unverified account</span>. Please contribute with caution or verify the organizer's credentials.
                                </div>
                            </div>
                        )}
                        <div>
                            <BackButton label="Back" />
                        </div>

                        {/* 2. Campaign Header & Meta Hero Block */}
                        <div className="space-y-3">
                            {/* Campaign Title & Category Tag */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-snug">
                                    {campaign.title}
                                </h1>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 w-fit">
                                    {campaign.category}
                                </span>
                            </div>

                            {/* Meta Information: Organizer Info + Location + Creation Date + Report */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-sm text-slate-500">
                                <Link
                                    to={`/profile/${campaign.createdById}`}
                                    className="inline-flex items-center space-x-2 group hover:text-slate-900 transition"
                                >
                                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white overflow-hidden flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20 shrink-0">
                                        {campaign.createdBy?.profilePhotoUrl ? (
                                            <img src={campaign.createdBy.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            campaign.createdBy?.displayName?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <span className="text-slate-600 group-hover:text-emerald-700 transition flex items-center space-x-1.5">
                                        <span>Organized by <strong className="font-semibold text-slate-800">{campaign.createdBy?.displayName || 'Anonymous'}</strong></span>
                                        {campaign.createdBy?.isVerified && (
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                                                Verified ✓
                                            </span>
                                        )}
                                    </span>
                                </Link>

                                {campaign.location && (
                                    <>
                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                        <span className="inline-flex items-center space-x-1 text-xs text-slate-500">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{campaign.location}</span>
                                        </span>
                                    </>
                                )}

                                <span className="text-slate-300 hidden sm:inline">•</span>

                                <span className="inline-flex items-center space-x-1 text-xs text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Created {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </span>

                                <span className="text-slate-300 hidden sm:inline">•</span>

                                <button
                                    onClick={() => setReportModalOpen(true)}
                                    className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-red-600 transition cursor-pointer"
                                >
                                    <Flag className="w-3.5 h-3.5" />
                                    <span>Report this campaign</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Aspect Ratio Image (16:9 rounded-xl with subtle shadow) */}
                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-sm">
                            <img
                                src={`data:${campaign.imageType};base64,${campaign.imageData}`}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Social Media / Video Links Section (Displayed Before About Section) */}
                        {campaign.videoLink && (
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Featured Video & Social Media Proofs</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {campaign.videoLink.split(/[\n,]+/).map(l => l.trim()).filter(l => l !== '').map((link, idx) => {
                                        const trimmed = link;
                                        const isYouTube = trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
                                        const isFacebook = trimmed.includes('facebook.com') || trimmed.includes('fb.watch');
                                        const isInstagram = trimmed.includes('instagram.com');
                                        const label = isYouTube ? 'YouTube Video' : isFacebook ? 'Facebook Video' : isInstagram ? 'Instagram Video' : `Proof Link #${idx + 1}`;
                                        
                                        return (
                                            <a
                                                key={idx}
                                                href={trimmed.startsWith('http') ? trimmed : `https://${trimmed}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-3 p-3.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-semibold rounded-2xl transition border border-slate-200 hover:border-emerald-200 group shadow-xs"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                                                    🔗
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">{label}</div>
                                                    <div className="text-[11px] text-slate-400 truncate">{trimmed}</div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 4. Combined Layout: Story on top, Donation Ledger & Comments below */}
                        <div className="space-y-6">
                            {/* About the Cause Card */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
                                <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
                                    <Info className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-xl font-bold tracking-tight">About the Cause</h2>
                                </div>
                                <div className="text-slate-600 leading-relaxed font-normal whitespace-pre-line text-base break-words overflow-wrap-anywhere">
                                    {campaign.description}
                                </div>
                            </div>

                            {/* Updates & Comments Card */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center space-x-2 text-slate-900">
                                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                                        <h2 className="text-xl font-bold tracking-tight">Updates & Comments</h2>
                                    </div>
                                    <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                                        {comments.length} Comments
                                    </span>
                                </div>

                                {user ? (
                                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                                        <textarea
                                            required
                                            rows={3}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Leave a word of encouragement or question for the organizer..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={commentSubmitting}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                                            >
                                                <Send className="w-4 h-4" />
                                                <span>{commentSubmitting ? 'Posting...' : 'Post Comment'}</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center text-sm text-slate-600">
                                        Please <Link to="/login" className="text-emerald-600 font-semibold underline hover:text-emerald-700">sign in</Link> to leave a comment or message of support.
                                    </div>
                                )}

                                <div className="divide-y divide-slate-100 pt-2 space-y-4">
                                    {comments.length === 0 ? (
                                        <p className="text-slate-400 text-sm text-center py-6">
                                            No comments yet. Be the first to share words of encouragement!
                                        </p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                                                        {comment.user?.profilePhotoUrl ? (
                                                            <img src={comment.user.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            comment.user?.displayName?.charAt(0).toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-semibold text-slate-900 text-sm">{comment.user?.displayName || 'Anonymous'}</span>
                                                            <span className="text-xs text-slate-400">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">{comment.content}</p>
                                                    </div>
                                                </div>

                                                {user && (user.userId === comment.userId || user.role === 'ADMIN') && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                                                        title="Delete Comment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Column (4 cols) */}
                    <div className="lg:col-span-4 lg:h-full">
                        <div className="sticky top-24 bg-white rounded-xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6">
                            
                            {/* Fundraising Progress */}
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                                    Fundraising Progress
                                </span>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-3xl font-bold text-slate-900">
                                        ৳{campaign.currentAmount.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        raised of ৳{campaign.targetAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                    <span className="text-emerald-700">{progress}% Funded</span>
                                    {daysRemaining !== null && (
                                        <span className="flex items-center space-x-1 text-slate-500">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{daysRemaining} days left</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Primary & Secondary Action CTAs */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setDonateModalOpen(true)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm hover:shadow transition duration-200 flex items-center justify-center space-x-2 text-sm uppercase tracking-wider cursor-pointer"
                                >
                                    <Heart className="w-4 h-4 fill-white" />
                                    <span>Donate Now (৳)</span>
                                </button>

                                <button
                                    onClick={() => setShareModalOpen(true)}
                                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition border border-slate-200/80 flex items-center justify-center space-x-2 text-sm shadow-xs cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4 text-slate-400" />
                                    <span>Share Campaign</span>
                                </button>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Sidebar Donation Ledger Preview */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                                        <Heart className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Recent Contributions</span>
                                    </span>
                                    <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                                        {campaign.donations?.length || 0}
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100 space-y-2">
                                    {(!campaign.donations || campaign.donations.length === 0) ? (
                                        <p className="text-xs text-slate-400 text-center py-4">No donations yet. Be the first!</p>
                                    ) : (
                                        campaign.donations.slice(0, 3).map(don => (
                                            <div key={don.id} className="pt-2 flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                                        {don.isAnonymous ? '?' : (don.donorName?.charAt(0).toUpperCase() || 'D')}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 line-clamp-1">{don.isAnonymous ? 'Anonymous' : don.donorName}</p>
                                                        <p className="text-[10px] text-slate-400">{new Date(don.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className="font-extrabold text-emerald-700">৳{don.amount.toLocaleString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {campaign.donations && campaign.donations.length > 3 && (
                                    <button
                                        onClick={() => setAllDonationsModalOpen(true)}
                                        className="w-full mt-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                                    >
                                        View All Contributions ({campaign.donations.length})
                                    </button>
                                )}
                            </div>

                            {/* Trust & Guarantee note & Report button */}
                            <div className="pt-2 flex flex-col items-center space-y-2 text-center">
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* DONATE MODAL */}
            {donateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Secure Contribution</span>
                                <h3 className="text-xl font-black text-slate-900 mt-0.5">Support This Cause</h3>
                            </div>
                            <button
                                onClick={() => setDonateModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleDonateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Donation Amount (BDT ৳) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">৳</span>
                                    <input
                                        type="number"
                                        min="10"
                                        step="any"
                                        required
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        placeholder="e.g. 1000"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            </div>

                            {!isAnonymous && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Your Name or Nickname</label>
                                    <input
                                        type="text"
                                        value={donorNameInput}
                                        onChange={(e) => setDonorNameInput(e.target.value)}
                                        placeholder={user ? user.displayName : "Enter your name (Optional)"}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            )}

                            <div className="flex items-center space-x-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="anonymousCheck"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label htmlFor="anonymousCheck" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                    Donate anonymously (hide my name from public ledger)
                                </label>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={donating}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                                >
                                    <Heart className="w-4 h-4 fill-white" />
                                    <span>{donating ? 'Processing Payment...' : `Contribute ৳${donationAmount || '0'}`}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ALL CONTRIBUTIONS MODAL */}
            {allDonationsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Complete Ledger</span>
                                <h3 className="text-xl font-black text-slate-900 mt-0.5">All Contributions ({campaign.donations?.length || 0})</h3>
                            </div>
                            <button
                                onClick={() => setAllDonationsModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 divide-y divide-slate-100 flex-1">
                            {(!campaign.donations || campaign.donations.length === 0) ? (
                                <p className="text-slate-400 text-sm text-center py-12">No donations recorded yet.</p>
                            ) : (
                                campaign.donations.map(don => (
                                    <div key={don.id} className="py-4 first:pt-0 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                                {don.isAnonymous ? '?' : (don.donorName?.charAt(0).toUpperCase() || 'D')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{don.isAnonymous ? 'Anonymous Donor' : don.donorName}</p>
                                                <p className="text-xs text-slate-400">{new Date(don.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-700 font-extrabold text-base">৳{don.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 text-right sticky bottom-0">
                            <button
                                onClick={() => setAllDonationsModalOpen(false)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
                            >
                                Close Ledger
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* YouTube-style Share Modal */}
            {shareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Share Campaign</h3>
                            <button
                                onClick={() => setShareModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Social Media Grid */}
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition shadow-sm border border-blue-100">
                                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">Facebook</span>
                            </a>

                            <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(campaign.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-105 transition shadow-sm border border-sky-100">
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">Twitter / X</span>
                            </a>

                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this fundraiser: ${campaign.title} ${window.location.href}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition shadow-sm border border-emerald-100">
                                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.148-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">WhatsApp</span>
                            </a>

                            <a
                                href={`mailto:?subject=${encodeURIComponent(campaign.title)}&body=${encodeURIComponent(`Check out this fundraiser: ${window.location.href}`)}`}
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition shadow-sm border border-amber-100">
                                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">Email</span>
                            </a>
                        </div>

                        {/* Copy Link Section */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Copy Link</label>
                            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-4">
                                <input
                                    type="text"
                                    readOnly
                                    value={window.location.href}
                                    className="bg-transparent text-sm text-slate-700 w-full focus:outline-none select-all"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2500);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 cursor-pointer flex items-center space-x-1"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <span>Copy</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Campaign Modal */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Flag className="w-5 h-5 text-red-600" />
                                <span>Report Campaign</span>
                            </h3>
                            <button
                                onClick={() => setReportModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Please provide a reason why you are reporting this fundraiser. Our admin team will review your report promptly.
                        </p>

                        <form onSubmit={handleReportSubmit} className="space-y-4">
                            <textarea
                                required
                                rows={4}
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Explain why this campaign violates terms or seems suspicious..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition resize-none"
                            />
                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReportModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-red-600/20 cursor-pointer"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
