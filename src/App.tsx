/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SubjectMockTests } from './components/SubjectMockTests';
import { SamplePapersSection } from './components/SamplePapersSection';
import { PyqsSection } from './components/PyqsSection';
import { Footer } from './components/Footer';
import { TestEngineModal } from './components/TestEngineModal';
import { MembershipModal } from './components/MembershipModal';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AppointmentModal } from './components/AppointmentModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserProfile } from './types';
import { api, setSessionUserId, setSessionToken, clearSession } from './services/api';
import { supabase, isSupabaseClientConfigured } from './lib/supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');

  // Modals
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);

  // Load user session
  const loadUserData = async () => {
    try {
      const meRes = await api.getCurrentUser();
      setCurrentUser(meRes.user);
    } catch (err) {
      console.warn('Current user session check:', err);
    }
  };

  useEffect(() => {
    loadUserData();

    // Listen for Supabase Auth state changes if Supabase client is configured
    if (isSupabaseClientConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token) {
          setSessionToken(session.access_token);
          try {
            const syncRes = await api.syncProfile(session.access_token);
            if (syncRes.user) {
              setCurrentUser(syncRes.user);
              setSessionUserId(syncRes.user.id);
            }
          } catch (e) {
            console.warn('Profile sync error:', e);
          }
        } else if (event === 'SIGNED_OUT') {
          clearSession();
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    clearSession();
    setCurrentUser(null);
    if (currentView === 'admin-dashboard') {
      setCurrentView('home');
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'mock-tests') {
      const el = document.getElementById('mock-tests-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'sample-papers') {
      const el = document.getElementById('sample-papers-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'pyqs') {
      const el = document.getElementById('pyqs-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExploreTests = () => {
    const el = document.getElementById('mock-tests-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentView('mock-tests');
    }
  };

  // Strictly protected Admin Dashboard view
  if (currentView === 'admin-dashboard') {
    if (currentUser?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center text-slate-100 shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl">
              !
            </div>
            <h3 className="text-lg font-black text-white mb-2">Restricted Area</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Only verified administrators may access the VEDICX Management Console. Please authenticate using the Admin Portal.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setAdminLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Open Admin Portal
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <AdminDashboard
        currentUser={currentUser}
        onExitAdmin={() => setCurrentView('home')}
      />
    );
  }

  const isPremium = currentUser?.membership_tier === 'premium';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenMembership={() => setMembershipModalOpen(true)}
        onOpenAppointment={() => setAppointmentModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onExploreTests={handleExploreTests}
          onOpenMembership={() => setMembershipModalOpen(true)}
          onOpenAppointment={() => setAppointmentModalOpen(true)}
          isPremium={isPremium}
        />

        {/* Chapter-wise Mock Tests Section with 5 slots per chapter */}
        <SubjectMockTests
          currentUser={currentUser}
          onStartTest={(testId) => setActiveTestId(testId)}
          onOpenMembership={() => setMembershipModalOpen(true)}
        />

        {/* Official CBSE Sample Papers */}
        <SamplePapersSection
          currentUser={currentUser}
          onOpenMembership={() => setMembershipModalOpen(true)}
        />

        {/* Previous Year Questions Section */}
        <PyqsSection />

        {/* Membership Callout Section */}
        {!isPremium && currentUser?.role !== 'admin' && (
          <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-4">
                Unlock Complete Class 10 Suite
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                One-Time ₹49. Unlimited Exam Preparation.
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Gain full access to all 5 mock test slots across every chapter of Mathematics, Science and Social Science, downloadable sample papers, and verified CBSE PYQs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setMembershipModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xl shadow-blue-500/30 cursor-pointer transition-all active:scale-98"
                >
                  Unlock Access – ₹49
                </button>
                <button
                  onClick={handleExploreTests}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-base border border-slate-700 cursor-pointer transition-all"
                >
                  Explore Free Mocks First
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer with Mailto support and Solitary Admin Portal link at the bottom */}
      <Footer
        onNavigate={handleNavigate}
        onOpenMembership={() => setMembershipModalOpen(true)}
        onOpenAppointment={() => setAppointmentModalOpen(true)}
        onOpenAdminLogin={() => setAdminLoginModalOpen(true)}
      />

      {/* Test Execution Engine Modal */}
      {activeTestId && (
        <TestEngineModal
          mockTestId={activeTestId}
          onClose={() => {
            setActiveTestId(null);
            loadUserData();
          }}
          onOpenMembership={() => {
            setActiveTestId(null);
            setMembershipModalOpen(true);
          }}
        />
      )}

      {/* 1-on-1 Academic Mentorship Appointment Modal */}
      {appointmentModalOpen && (
        <AppointmentModal
          currentUser={currentUser}
          onClose={() => setAppointmentModalOpen(false)}
        />
      )}

      {/* ₹49 Membership Modal */}
      {membershipModalOpen && (
        <MembershipModal
          currentUser={currentUser}
          onClose={() => setMembershipModalOpen(false)}
          onSuccess={() => {
            setMembershipModalOpen(false);
            loadUserData();
          }}
        />
      )}

      {/* Student Sign-in / Registration Modal */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            loadUserData();
          }}
        />
      )}

      {/* Dedicated Admin Login Modal */}
      {adminLoginModalOpen && (
        <AdminLoginModal
          onClose={() => setAdminLoginModalOpen(false)}
          onAdminSuccess={(adminUser) => {
            setCurrentUser(adminUser);
            setCurrentView('admin-dashboard');
          }}
        />
      )}
    </div>
  );
}
