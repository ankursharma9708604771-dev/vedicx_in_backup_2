import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Globe,
  Tag,
  DollarSign,
  Mail,
  Phone,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

interface SiteSettingsTabProps {
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const SiteSettingsTab: React.FC<SiteSettingsTabProps> = ({ showNotification }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getSettings();
        setSettings(res.settings || {});
      } catch (err: any) {
        showNotification('error', err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(settings);
      showNotification('success', 'Website settings and CMS content updated successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateKey = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>Website Content & CMS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure homepage copy, branding, pricing, support channels and active banner announcements.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* HOMEPAGE HERO SECTION */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Homepage Hero Copy</span>
          </h3>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Primary Hero Heading *
            </label>
            <input
              type="text"
              value={settings['hero_heading'] || 'Prepare Smarter. Score Better.'}
              onChange={e => updateKey('hero_heading', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Hero Supporting Subheading *
            </label>
            <textarea
              rows={2}
              value={
                settings['hero_subheading'] ||
                'Practice Class 10 chapter-wise mock tests, solve sample papers and prepare with previous year questions.'
              }
              onChange={e => updateKey('hero_subheading', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings['site_tagline'] || 'Learn. Practice. Perform.'}
                onChange={e => updateKey('site_tagline', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Primary CTA Button Text</label>
              <input
                type="text"
                value={settings['hero_cta_text'] || 'Explore Mock Tests'}
                onChange={e => updateKey('hero_cta_text', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>
        </div>

        {/* PRICING & MEMBERSHIP */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Class 10 Membership & Pricing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Premium Upgrade Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={settings['premium_price'] || '49'}
                  onChange={e => updateKey('premium_price', e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-sm font-mono text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Pricing Plan Description</label>
              <input
                type="text"
                value={
                  settings['pricing_description'] ||
                  'Full academic year access to all Science, Mathematics and Social Science mock tests.'
                }
                onChange={e => updateKey('pricing_description', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT BANNER */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>Top Announcement Banner</span>
          </h3>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Banner Message (Leave blank to hide banner)
            </label>
            <input
              type="text"
              value={settings['announcement_banner'] || ''}
              onChange={e => updateKey('announcement_banner', e.target.value)}
              placeholder="e.g. CBSE 2025 Board Mock Test Series Now Live! All 49 Chapters Ready."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
            />
          </div>
        </div>

        {/* CONTACT & SUPPORT CHANNELS */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Support & Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Support Email</label>
              <input
                type="email"
                value={settings['contact_email'] || 'supportvedicx@gmail.com'}
                onChange={e => updateKey('contact_email', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Support WhatsApp / Phone</label>
              <input
                type="text"
                value={settings['contact_phone'] || '+91 98765 43210'}
                onChange={e => updateKey('contact_phone', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Apply & Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
