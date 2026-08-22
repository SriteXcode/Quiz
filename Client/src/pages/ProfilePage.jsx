import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Lock,
  Camera,
  ShieldCheck,
  GraduationCap,
  Mail,
  Phone,
  Edit3,
  Shield,
  FileText,
  Zap,
  Trophy,
  Award,
  Wifi,
  WifiOff,
  User
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CertificateModal from '../components/CertificateModal';
import ImageAdjustModal from '../components/ImageAdjustModal';
import { apiGetUserCertificates, apiUpdateProfile, apiGetUserProfileStats } from '../services/api';

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <Skeleton type="card" className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton type="card" className="h-32 rounded-2xl" />
        <Skeleton type="card" className="h-32 rounded-2xl" />
        <Skeleton type="card" className="h-32 rounded-2xl" />
      </div>
      <Skeleton type="card" className="h-64 w-full rounded-3xl" />
    </div>
  );
};

export const ProfilePage = ({ onNavigateToQuiz, onNavigateHome, onNavigateAdmin }) => {
  const { user, logout, updateUserData } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'certificates' | 'stats' | 'history'

  // Dynamic Certificates State
  const [certificates, setCertificates] = useState([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Avatar Direct Upload & Adjuster State
  const headerAvatarInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustImageSrc, setAdjustImageSrc] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState('direct'); // 'direct' | 'modal'
  const [isUploadingDirectAvatar, setIsUploadingDirectAvatar] = useState(false);

  // Dynamic Profile Stats & Ranking State
  const [profileStats, setProfileStats] = useState({
    totalQuizzes: 0,
    totalSubmissions: 0,
    officialCount: 0,
    practiceCount: 0,
    highestScore: '0%',
    highestScoreRaw: 0,
    categoryStats: {},
    totalPoints: '0',
    totalPointsRaw: 0,
    globalRank: '#1',
    globalRankNumber: 1,
    totalRankedUsers: 1,
    winRate: '0%',
    averageAccuracy: 0,
    totalCertificates: 0,
    badges: [],
    recentHistory: []
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // History Filter
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'official' | 'practice'

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    dob: '',
    school: '',
    studentClass: '',
    fatherName: '',
    phone: '',
    avatarFile: null,
    avatarPreview: ''
  });

  // Handle direct file selection from header avatar circle
  const handleHeaderAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const src = URL.createObjectURL(file);
      setAdjustImageSrc(src);
      setAdjustTarget('direct');
      setIsAdjustModalOpen(true);
    }
  };

  // Handle file selection from inside the Edit Profile Modal
  const handleModalAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const src = URL.createObjectURL(file);
      setAdjustImageSrc(src);
      setAdjustTarget('modal');
      setIsAdjustModalOpen(true);
    }
  };

  // Handle cropped/adjusted image result from ImageAdjustModal
  const handleApplyAdjustedAvatar = async (croppedDataUrl, fileBlob) => {
    setIsAdjustModalOpen(false);

    if (adjustTarget === 'modal') {
      setEditForm((prev) => ({
        ...prev,
        avatarFile: fileBlob,
        avatarPreview: croppedDataUrl
      }));
      return;
    }

    // If direct upload from circle, save immediately to backend
    setIsUploadingDirectAvatar(true);
    try {
      const formData = new FormData();
      if (user?.name) formData.append('name', user.name);
      formData.append('avatar', fileBlob);

      const res = await apiUpdateProfile(formData);
      if (res.success && res.user) {
        if (updateUserData) {
          updateUserData(res.user);
        }
        addToast('🎉 Profile photo updated successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update profile photo', 'error');
    } finally {
      setIsUploadingDirectAvatar(false);
    }
  };

  // Network Connectivity State (Online / Offline)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  // Fetch dynamic profile statistics, ranking & certificates from DB or cache
  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    const userId = user._id || user.id;

    // Load cached stats and certs if available
    try {
      const cachedStats = localStorage.getItem(`cached_profile_stats_${userId}`);
      if (cachedStats) {
        setProfileStats((prev) => ({ ...prev, ...JSON.parse(cachedStats) }));
      }
      const cachedCerts = localStorage.getItem(`cached_profile_certs_${userId}`);
      if (cachedCerts) {
        setCertificates(JSON.parse(cachedCerts));
      }
    } catch {
      // ignore parse err
    }

    if (!navigator.onLine) {
      return;
    }

    setIsLoadingStats(true);
    setIsLoadingCertificates(true);

    try {
      const [statsRes, certsRes] = await Promise.allSettled([
        apiGetUserProfileStats(userId),
        apiGetUserCertificates(userId)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value?.stats) {
        setProfileStats(statsRes.value.stats);
        localStorage.setItem(`cached_profile_stats_${userId}`, JSON.stringify(statsRes.value.stats));
      }

      if (certsRes.status === 'fulfilled' && certsRes.value?.success && certsRes.value?.certificates) {
        setCertificates(certsRes.value.certificates);
        localStorage.setItem(`cached_profile_certs_${userId}`, JSON.stringify(certsRes.value.certificates));
      } else if (certsRes.status === 'fulfilled') {
        setCertificates([]);
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingCertificates(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      fetchProfileData();
      const timer = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnectedBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchProfileData]);

  // Compute Unlocked Badges count dynamically
  const unlockedBadgesCount = useMemo(() => {
    return (profileStats.badges || []).filter(b => b.unlocked).length;
  }, [profileStats.badges]);

  const totalBadgesCount = (profileStats.badges || []).length || 6;

  // Filtered History list
  const filteredHistory = useMemo(() => {
    const history = profileStats.recentHistory || [];
    if (historyFilter === 'official') {
      return history.filter(h => h.badge === 'Official' || h.badge === 'Live Quiz');
    }
    if (historyFilter === 'practice') {
      return history.filter(h => h.badge === 'Practice' || h.badge === 'Replay');
    }
    return history;
  }, [profileStats.recentHistory, historyFilter]);

  // Calculate dynamic Profile Completion Percentage (0% - 100%)
  const profileCompletion = useMemo(() => {
    if (!user) return { percentage: 0, missing: [], completedCount: 0, totalCount: 8 };

    const fields = [
      { key: 'name', weight: 15, label: 'Full Name' },
      { key: 'email', weight: 15, label: 'Email' },
      { key: 'phone', weight: 15, label: 'Phone' },
      { key: 'school', weight: 15, label: 'School/College' },
      { key: 'studentClass', weight: 10, label: 'Class/Grade' },
      { key: 'dob', weight: 10, label: 'DOB' },
      { key: 'fatherName', weight: 10, label: "Father's Name" },
      { key: 'avatarUrl', weight: 10, label: 'Profile Photo' }
    ];

    let score = 0;
    let completedCount = 0;
    const missing = [];

    fields.forEach((field) => {
      if (user[field.key] && String(user[field.key]).trim() !== '') {
        score += field.weight;
        completedCount += 1;
      } else {
        missing.push(field.label);
      }
    });

    return {
      percentage: Math.min(100, score),
      missing,
      completedCount,
      totalCount: fields.length
    };
  }, [user]);

  // Live profile completion calculation inside Edit Modal
  const editFormCompletion = useMemo(() => {
    const fields = [
      { value: editForm.name, weight: 15 },
      { value: user?.email, weight: 15 },
      { value: editForm.phone, weight: 15 },
      { value: editForm.school, weight: 15 },
      { value: editForm.studentClass, weight: 10 },
      { value: editForm.dob, weight: 10 },
      { value: editForm.fatherName, weight: 10 },
      { value: editForm.avatarPreview || user?.avatarUrl, weight: 10 }
    ];

    let score = 0;
    fields.forEach((f) => {
      if (f.value && String(f.value).trim() !== '') score += f.weight;
    });
    return Math.min(100, score);
  }, [editForm, user]);

  if (!user) {
    return (
      <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-theme)] my-8 max-w-lg mx-auto shadow-xl">
        <Lock className="w-12 h-12 text-[var(--color-primary-600)] mx-auto mb-3" />
        <h2 className="text-2xl font-bold font-poppins text-[var(--text-main)]">Access Restricted</h2>
        <p className="text-xs font-lato text-[var(--text-muted)] mt-2">
          Please log in to view your candidate profile, badges, and certificates.
        </p>
      </div>
    );
  }

  // Handle opening Edit Profile Modal with pre-filled data
  const handleOpenEditModal = () => {
    setEditForm({
      name: user.name || '',
      dob: user.dob || '',
      school: user.school || '',
      studentClass: user.studentClass || '',
      fatherName: user.fatherName || '',
      phone: user.phone || '',
      avatarFile: null,
      avatarPreview: user.avatarUrl || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle saving updated profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      addToast('Full Name is required', 'warning');
      return;
    }

    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name.trim());
      formData.append('dob', editForm.dob.trim());
      formData.append('school', editForm.school.trim());
      formData.append('studentClass', editForm.studentClass.trim());
      formData.append('fatherName', editForm.fatherName.trim());
      formData.append('phone', editForm.phone.trim());

      if (editForm.avatarFile) {
        formData.append('avatar', editForm.avatarFile);
      }

      const res = await apiUpdateProfile(formData);
      if (res.success && res.user) {
        if (updateUserData) {
          updateUserData(res.user);
        }
        addToast('Profile updated successfully!', 'success');
        setIsEditModalOpen(false);
      } else {
        addToast(res.message || 'Profile updated', 'success');
        setIsEditModalOpen(false);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (onNavigateHome) onNavigateHome();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 animate-fadeIn space-y-8">

      {/* OFFLINE STATUS NOTE */}
      {!isOnline && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:bg-amber-950/40 border border-amber-500/40 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="font-poppins font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-center space-x-2">
                <span>You are currently offline</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              <p className="font-lato text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                Connect to the internet to sync your real-time score statistics, rank upgrades, and official certificates.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
            <span className="px-3 py-1 rounded-xl text-[11px] font-mono font-bold uppercase bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
              Offline Cache
            </span>
          </div>
        </div>
      )}

      {/* RECONNECTED ONLINE STATUS NOTE */}
      {isOnline && (showReconnectedBanner || wasOffline) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="font-poppins font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center space-x-2">
                <span>We are online!</span>
                <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <p className="font-lato text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                Internet connection restored. Your profile data, certificates, and leaderboard rankings have been synced.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
            <span className="px-3 py-1 rounded-xl text-[11px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30">
              ✓ Synced
            </span>
          </div>
        </div>
      )}

      {/* COMPLETE PROFILE BANNER / PROGRESS BAR BUTTON (THEME VARIABLE COMPLIANT) */}
      {profileCompletion.percentage < 100 && (
        <button
          type="button"
          onClick={handleOpenEditModal}
          className="w-full relative h-11 sm:h-12 rounded-2xl bg-[var(--color-secondary-300)] dark:bg-[var(--color-secondary-350)] border-2 border-[var(--border-theme)] shadow-md overflow-hidden cursor-pointer group hover:border-[var(--color-primary-500)] transition-all active:scale-[0.99] select-none my-1"
          title="Click to complete your candidate profile"
        >
          {/* Filled Progress Portion (Theme Secondary Color) */}
          <div
            style={{ width: `${profileCompletion.percentage}%` }}
            className="absolute inset-y-0 left-0 bg-[var(--color-secondary-500)] dark:bg-[var(--color-secondary-600)] group-hover:brightness-105 transition-all duration-500 border-r-2 border-[var(--color-secondary-700)]"
          />

          {/* Single-Line Centered White Content Overlay */}
          <div className="absolute inset-0 px-4 sm:px-6 flex items-center justify-center z-10 font-poppins font-bold text-xs sm:text-sm text-[#1A1A1A] drop-shadow-md whitespace-nowrap">
            <span className="whitespace-nowrap flex items-center justify-center space-x-1.5 min-w-0">
              <span className="whitespace-nowrap">Complete Profile {profileCompletion.percentage}% to 100%</span>
            </span>

            {/* Circular Theme Primary Arrow Icon Badge Anchored Right */}
            <div className="absolute right-3 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--color-primary-600)] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[var(--color-primary-700)] transition-all shrink-0 border border-white/30">
              <svg
                className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* PROFILE HEADER HERO BANNER CARD */}
      <div className="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-secondary-600)] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">

          {/* Avatar Picture - Clickable with Live Crop & Adjust */}
          <div className="relative">
            <div
              onClick={() => headerAvatarInputRef.current && headerAvatarInputRef.current.click()}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 bg-white text-[var(--color-primary-600)] flex items-center justify-center font-bold text-4xl shadow-xl overflow-hidden shrink-0 cursor-pointer group relative hover:scale-105 transition-transform"
              title="Click avatar circle to change & adjust photo"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
              ) : (
                <span>{user.name ? user.name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}</span>
              )}

              {/* Hover Camera Overlay Badge */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-poppins font-bold space-y-0.5 backdrop-blur-[1px]">
                <Camera className="w-5 h-5 text-white" />
                <span>{isUploadingDirectAvatar ? 'Saving...' : 'Update'}</span>
              </div>
            </div>

            <input
              ref={headerAvatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeaderAvatarSelect}
            />

            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-amber-400 text-slate-900 shadow-md whitespace-nowrap z-10 pointer-events-none flex items-center space-x-1">
              {user.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3 h-3" />
                  <span>Student</span>
                </>
              )}
            </span>
          </div>

          {/* User Info Details */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-poppins">
                {user.name || 'User Profile'}
              </h1>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-poppins font-bold bg-white/20 text-white w-fit mx-auto sm:mx-0">
                {user.school || 'Quiz Platform Scholar'}
              </span>
            </div>

            <div className="text-xs sm:text-sm font-lato text-blue-100 mb-3 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5" /><span>{user.email}</span></span>
                <span>•</span>
                <span className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5" /><span>{user.phone || 'Phone not set'}</span></span>
              </div>

              {/* Profile Completion Badge in Hero Header */}
              <div className="pt-1 flex items-center justify-center sm:justify-start space-x-2">
                <div className="w-28 sm:w-36 h-2 rounded-full bg-white/25 overflow-hidden shrink-0 border border-white/20">
                  <div
                    style={{ width: `${profileCompletion.percentage}%` }}
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500 shadow-xs"
                  />
                </div>
                <span className="text-[11px] font-poppins font-bold text-amber-300">
                  {profileCompletion.percentage}% Profile Complete
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-poppins font-semibold text-xs transition-all cursor-pointer backdrop-blur-md shadow-sm active:scale-95 flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{profileCompletion.percentage < 100 ? `Complete Profile (${profileCompletion.percentage}%)` : 'Edit Profile'}</span>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => onNavigateAdmin && onNavigateAdmin()}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-poppins font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center space-x-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* DYNAMIC STATS OVERVIEW CARDS (CALCULATED FROM DB) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 1. Dynamic Quizzes Taken */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
          <FileText className="w-6 h-6 mx-auto mb-1 text-[var(--color-primary-600)]" />
          <div className="font-poppins font-bold text-xl sm:text-2xl text-[var(--color-primary-600)]">
            {isLoadingStats ? '...' : profileStats.totalQuizzes}
          </div>
          <div className="text-xs font-lato text-[var(--text-muted)]">Quizzes Taken</div>
        </div>

        {/* 2. Dynamic Total XP Score */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
          <Zap className="w-6 h-6 mx-auto mb-1 text-[var(--color-secondary-600)]" />
          <div className="font-poppins font-bold text-xl sm:text-2xl text-[var(--color-secondary-600)]">
            {isLoadingStats ? '...' : profileStats.totalPoints}
          </div>
          <div className="text-xs font-lato text-[var(--text-muted)]">Total XP Score</div>
        </div>

        {/* 3. Dynamic Real-Time Global Rank */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
          <Trophy className="w-6 h-6 mx-auto mb-1 text-amber-500" />
          <div className="font-poppins font-bold text-xl sm:text-2xl text-amber-500">
            {isLoadingStats ? '...' : profileStats.globalRank}
          </div>
          <div className="text-xs font-lato text-[var(--text-muted)]">
            Global Rank {profileStats.totalRankedUsers ? `(of ${profileStats.totalRankedUsers})` : ''}
          </div>
        </div>

        {/* 4. Dynamic Accuracy Rate */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
          <Award className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
          <div className="font-poppins font-bold text-xl sm:text-2xl text-emerald-500">
            {isLoadingStats ? '...' : profileStats.winRate}
          </div>
          <div className="text-xs font-lato text-[var(--text-muted)]">Overall Accuracy</div>
        </div>
      </div>

      {/* DYNAMIC TABS NAVIGATION WITH REAL COUNTERS */}
      <div className="border-b border-[var(--border-theme)] pb-3 flex flex-wrap gap-2">
        {[
          {
            id: 'details',
            label: '👤 Account Details'
          },
          {
            id: 'certificates',
            label: `🎓 Earned Certificates (${certificates.length})`
          },
          {
            id: 'stats',
            label: `🏆 Badges & Performance (${unlockedBadgesCount}/${totalBadgesCount})`
          },
          {
            id: 'history',
            label: `📜 Recent History (${profileStats.recentHistory?.length || 0})`
          }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-poppins font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === tab.id
              ? 'bg-[var(--color-primary-600)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DETAILS */}
      {activeTab === 'details' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
            <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">
              Personal & Academic Information
            </h3>
            <button
              onClick={handleOpenEditModal}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
            >
              <span>✏️ Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-lato text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Full Name</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Email Address</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">School / College</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.school || 'Not specified'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Class / Grade</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.studentClass || 'Not specified'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Father's Name</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.fatherName || 'Not specified'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Date of Birth (DOB)</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.dob || 'Not specified'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Phone Number</span>
              <p className="font-bold text-[var(--text-main)] text-base">{user.phone || 'Not specified'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] block">Role & Account Type</span>
              <p className="font-bold text-[var(--color-primary-600)] text-base uppercase">{user.role || 'student'}</p>
            </div>
          </div>

          {/* Account & Administration Quick Actions */}
          <div className="pt-4 border-t border-[var(--border-theme)] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-poppins font-bold text-[var(--text-muted)]">
              Account Security & Administration
            </div>
            <div className="flex items-center space-x-2">
              {user.role === 'admin' && (
                <button
                  onClick={() => onNavigateAdmin && onNavigateAdmin()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <span>🛡️ Admin Portal</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-poppins font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <span>🚪 Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 🎓 EARNED CERTIFICATES (DYNAMIC DB DATA) */}
      {activeTab === 'certificates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border-theme)] pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                  <span>🎓</span>
                  <span>Live Quiz Verified Certificates ({certificates.length})</span>
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  All certificates earned from completed live quiz assessments. Download in 4K resolution or print anytime.
                </p>
              </div>
              <button
                onClick={onNavigateToQuiz}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                + Earn New Certificate
              </button>
            </div>

            {isLoadingCertificates ? (
              <div className="py-12 text-center text-xs font-poppins text-[var(--text-muted)]">
                ⏳ Loading your earned certificates...
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <span className="text-4xl block">📜</span>
                <h4 className="font-poppins font-bold text-sm text-[var(--text-main)]">No Live Quiz Certificates Yet</h4>
                <p className="text-xs font-lato text-[var(--text-muted)] max-w-sm mx-auto">
                  Take and complete any live quiz assessment to earn your verified certificate of achievement.
                </p>
                <button
                  onClick={onNavigateToQuiz}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary-600)] text-white font-poppins font-bold text-xs cursor-pointer"
                >
                  Start Assessment Now →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert._id || cert.certificateId}
                    className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] hover:border-amber-400 transition-all shadow-sm hover:shadow-md space-y-4 relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl border border-amber-500/30">
                          📜
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            {cert.certificateId}
                          </span>
                          <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] mt-1">
                            {cert.quizTitle}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border-theme)] text-center text-xs font-poppins">
                      <div className="bg-[var(--bg-card)] p-2 rounded-xl">
                        <div className="text-[10px] text-[var(--text-muted)] font-lato">Score</div>
                        <div className="font-bold text-emerald-500">{cert.score}%</div>
                      </div>
                      <div className="bg-[var(--bg-card)] p-2 rounded-xl">
                        <div className="text-[10px] text-[var(--text-muted)] font-lato">Accuracy</div>
                        <div className="font-bold text-[var(--color-primary-600)]">{cert.accuracy}%</div>
                      </div>
                      <div className="bg-[var(--bg-card)] p-2 rounded-xl">
                        <div className="text-[10px] text-[var(--text-muted)] font-lato">XP Earned</div>
                        <div className="font-bold text-amber-500">+{cert.earnedXP}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-lato text-[var(--text-muted)]">
                        Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCert(cert);
                          setIsCertModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-poppins font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                      >
                        <span>👁️ View Certificate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: 🏆 DYNAMIC BADGES & PERFORMANCE METRICS */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-fadeIn">

          {/* Performance Analytics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-sm text-center">
              <span className="text-xl block mb-1">🎖️</span>
              <div className="font-poppins font-bold text-lg text-emerald-500">
                {profileStats.highestScore || '0%'}
              </div>
              <div className="text-[11px] font-lato text-[var(--text-muted)]">Highest Score</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-sm text-center">
              <span className="text-xl block mb-1">⚡</span>
              <div className="font-poppins font-bold text-lg text-amber-500">
                {profileStats.totalPoints || '0'} XP
              </div>
              <div className="text-[11px] font-lato text-[var(--text-muted)]">Platform XP</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-sm text-center">
              <span className="text-xl block mb-1">📊</span>
              <div className="font-poppins font-bold text-lg text-[var(--color-primary-600)]">
                {profileStats.officialCount || 0} / {profileStats.practiceCount || 0}
              </div>
              <div className="text-[11px] font-lato text-[var(--text-muted)]">Live Quiz / Practice</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-sm text-center">
              <span className="text-xl block mb-1">🏆</span>
              <div className="font-poppins font-bold text-lg text-indigo-500">
                {unlockedBadgesCount} / {totalBadgesCount}
              </div>
              <div className="text-[11px] font-lato text-[var(--text-muted)]">Badges Unlocked</div>
            </div>
          </div>

          {/* Dynamic Badges Grid */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-[var(--border-theme)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Performance Badges ({unlockedBadgesCount}/{totalBadgesCount})</span>
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Milestones automatically unlocked as you complete quizzes and reach higher accuracy
                </p>
              </div>
              <div className="text-xs font-poppins font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                {Math.round((unlockedBadgesCount / Math.max(1, totalBadgesCount)) * 100)}% Completed
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(profileStats.badges && profileStats.badges.length > 0 ? profileStats.badges : []).map((badge, idx) => (
                <div
                  key={badge.id || idx}
                  className={`p-4 rounded-2xl border transition-all space-y-2 relative overflow-hidden ${badge.unlocked
                    ? 'bg-gradient-to-b from-amber-500/10 to-[var(--bg-main)] border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-[var(--bg-main)] border-[var(--border-theme)] opacity-60'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl block">{badge.icon}</span>
                    <span className={`text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full ${badge.unlocked
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-theme)]'
                      }`}>
                      {badge.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                    </span>
                  </div>
                  <div className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)]">
                    {badge.name}
                  </div>
                  <div className="text-[10px] font-lato text-[var(--text-muted)] leading-relaxed">
                    {badge.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: 📜 DYNAMIC RECENT HISTORY (REAL DB SUBMISSIONS) */}
      {activeTab === 'history' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-theme)] pb-4">
            <div>
              <h3 className="text-lg font-bold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                <span>📜</span>
                <span>Recent Assessment History ({profileStats.recentHistory?.length || 0})</span>
              </h3>
              <p className="text-xs font-lato text-[var(--text-muted)]">
                Chronological record of all live quiz and practice assessments taken
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-theme)]">
              {[
                { id: 'all', label: `All (${profileStats.recentHistory?.length || 0})` },
                { id: 'official', label: `Live Quiz (${profileStats.officialCount || 0})` },
                { id: 'practice', label: `Practice (${profileStats.practiceCount || 0})` }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setHistoryFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-poppins font-bold transition-all cursor-pointer ${historyFilter === filter.id
                    ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="divide-y divide-[var(--border-theme)] text-xs sm:text-sm font-lato">
              {filteredHistory.map((item, index) => (
                <div key={item._id || index} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-main)]/50 px-2 rounded-xl transition-all">
                  <div className="space-y-1">
                    <div className="font-bold text-[var(--text-main)] font-poppins flex items-center space-x-2">
                      <span>{item.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${item.badge === 'Official' || item.badge === 'Live Quiz'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : item.badge === 'Practice'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                          : 'bg-purple-500/10 text-purple-600 border border-purple-500/30'
                        }`}>
                        {item.badge === 'Official' ? 'Live Quiz' : item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-2">
                      <span>⏱️ {item.time}</span>
                      <span>•</span>
                      <span className="text-[var(--color-primary-600)] font-semibold">{item.category}</span>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">{item.earnedXP}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-bold text-emerald-500 font-poppins text-sm">{item.score}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Accuracy: {item.accuracy}</div>
                    </div>
                    <button
                      onClick={onNavigateToQuiz}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs cursor-pointer transition-all active:scale-95"
                    >
                      Replay 🔁
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <span className="text-4xl block">📜</span>
              <h4 className="font-poppins font-bold text-sm text-[var(--text-main)]">
                {historyFilter === 'all' ? 'No Assessment History Yet' : `No ${historyFilter} assessments found`}
              </h4>
              <p className="text-xs font-lato text-[var(--text-muted)] max-w-sm mx-auto">
                Participate in technical quizzes to record your results and earn platform XP.
              </p>
              <button
                onClick={onNavigateToQuiz}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary-600)] text-white font-poppins font-bold text-xs cursor-pointer"
              >
                Browse Quizzes →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn my-auto max-h-[94vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-theme)] flex items-center justify-between bg-[var(--bg-main)] shrink-0">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">✏️</span>
                <div>
                  <h3 className="font-poppins font-bold text-base text-[var(--text-main)]">
                    {editFormCompletion < 100 ? '⭐ Complete Profile' : 'Edit Candidate Profile'}
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <div className="w-24 sm:w-32 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        style={{ width: `${editFormCompletion}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {editFormCompletion}% Complete
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-theme)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs font-poppins">

              {/* Avatar Upload Preview */}
              <div className="flex items-center space-x-4 p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)]">
                <div
                  onClick={() => modalAvatarInputRef.current && modalAvatarInputRef.current.click()}
                  className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-primary-100)] text-[var(--color-primary-600)] flex items-center justify-center font-bold text-2xl border-2 border-[var(--color-primary-400)] shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  title="Click to change and adjust photo"
                >
                  {editForm.avatarPreview ? (
                    <img src={editForm.avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{editForm.name ? editForm.name.charAt(0).toUpperCase() : '👤'}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Profile Avatar</label>
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current && modalAvatarInputRef.current.click()}
                    className="inline-block px-3 py-1.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    <span>Upload & Adjust Photo</span>
                  </button>
                  <input
                    ref={modalAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleModalAvatarSelect}
                    className="hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] block">Click circle or button to crop & adjust photo</span>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-main)] block">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  required
                />
              </div>

              {/* School / College */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-main)] block">School / College / University</label>
                <input
                  type="text"
                  value={editForm.school}
                  onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                  placeholder="e.g. Stanford University / Delhi Public School"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                />
              </div>

              {/* Class / Grade & DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Class / Grade</label>
                  <input
                    type="text"
                    value={editForm.studentClass}
                    onChange={(e) => setEditForm({ ...editForm, studentClass: e.target.value })}
                    placeholder="e.g. 12th Grade / B.Tech CSE"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Date of Birth (DOB)</label>
                  <input
                    type="text"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    placeholder="DD/MM/YYYY"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Father's Name & Phone Number */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Father's / Guardian's Name</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    placeholder="Father's name"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-bold text-xs cursor-pointer hover:bg-[var(--bg-card)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingProfile ? '⏳ Saving Changes...' : '💾 Save Profile Details'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CERTIFICATE PREVIEW MODAL */}
      {isCertModalOpen && selectedCert && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          data={selectedCert}
          user={user}
        />
      )}

      {/* AVATAR CROP & ADJUSTER MODAL */}
      <ImageAdjustModal
        isOpen={isAdjustModalOpen}
        imageSrc={adjustImageSrc}
        onClose={() => setIsAdjustModalOpen(false)}
        onApply={handleApplyAdjustedAvatar}
        title="Adjust & Position Profile Photo"
      />

    </div>
  );
};

export default ProfilePage;
