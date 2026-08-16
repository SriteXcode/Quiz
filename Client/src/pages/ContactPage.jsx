import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { apiGetSiteSettings, apiSubmitContactMessage } from '../services/api';

export const ContactPage = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Support',
    subject: '',
    message: ''
  });

  const [siteSettings, setSiteSettings] = useState({
    contact: {
      supportEmail: 'support@quizplatform.com',
      phone: '+91 9876543210',
      supportHours: 'Mon - Fri: 9:00 AM - 6:00 PM EST',
      headquarters: 'Innovation Tech Park, Silicon Boulevard, CA, 94025',
      socialLinks: {
        twitter: 'https://twitter.com',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        discord: 'https://discord.gg'
      }
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const res = await apiGetSiteSettings();
        if (res.success && res.settings) {
          setSiteSettings(res.settings);
        }
      } catch (err) {
        console.warn('[ContactPage Settings Error]: Using default fallback', err.message);
      }
    };
    fetchContactSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      addToast('Please fill in all fields before sending.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiSubmitContactMessage(formData);
      if (res.success) {
        addToast(res.message || 'Thank you for reaching out! Your message was sent successfully. ✉️', 'success');
        setFormData({ name: '', email: '', category: 'Support', subject: '', message: '' });
      } else {
        addToast(res.message || 'Failed to send message. Please try again.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error submitting message. Please check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contact = siteSettings.contact || {};

  return (
    <div className="max-w-full mx-auto animate-fadeIn space-y-10">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-secondary-600)] text-white rounded-3xl p-8 sm:p-10 text-center shadow-xl border border-white/10">
        <span className="inline-block px-3 py-1 mb-3 rounded-full bg-white/20 text-xs font-poppins font-bold uppercase tracking-wider">
          Get In Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-poppins mb-2">
          We'd Love to Hear From You
        </h1>
        <p className="font-lato text-xs sm:text-sm text-blue-100 max-w-lg mx-auto">
          Have questions about a live quiz, sponsorship opportunities, or platform feedback? Drop us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Cards Column */}
        <div className="lg:col-span-4 space-y-4">
          {[
            {
              icon: '✉️',
              title: 'Email Support',
              detail: contact.supportEmail || 'support@quizplatform.com',
              sub: 'Fast resolution for all inquiries'
            },
            {
              icon: '📞',
              title: 'Phone / Helpline',
              detail: contact.phone || '+91 9876543210',
              sub: contact.supportHours || 'Mon - Fri: 9:00 AM - 6:00 PM EST'
            },
            {
              icon: '📍',
              title: 'Headquarters',
              detail: contact.headquarters || 'Innovation Tech Park, CA',
              sub: 'Global remote & hybrid headquarters'
            },
            {
              icon: '💬',
              title: 'Discord Community',
              detail: contact.socialLinks?.discord ? 'Join Discord Server' : 'discord.gg/quizplatform',
              link: contact.socialLinks?.discord || 'https://discord.gg',
              sub: 'Connect with over 15k developers'
            }
          ].map((info, idx) => (
            <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 shadow-sm flex items-start space-x-4 hover:border-[var(--color-primary-400)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-50)] dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                {info.icon}
              </div>
              <div>
                <h4 className="font-poppins font-bold text-sm text-[var(--text-main)]">
                  {info.title}
                </h4>
                {info.link ? (
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-lato font-semibold text-xs text-[var(--color-primary-600)] hover:underline my-0.5 block"
                  >
                    {info.detail} ↗
                  </a>
                ) : (
                  <div className="font-lato font-semibold text-xs text-[var(--color-primary-600)] my-0.5">
                    {info.detail}
                  </div>
                )}
                <div className="font-lato text-[11px] text-[var(--text-muted)]">
                  {info.sub}
                </div>
              </div>
            </div>
          ))}

          {/* Social Links Row */}
          {contact.socialLinks && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 shadow-sm flex items-center justify-around text-lg">
              {contact.socialLinks.twitter && (
                <a href={contact.socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="Twitter / X">
                  🐦
                </a>
              )}
              {contact.socialLinks.github && (
                <a href={contact.socialLinks.github} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="GitHub">
                  🐙
                </a>
              )}
              {contact.socialLinks.linkedin && (
                <a href={contact.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="LinkedIn">
                  💼
                </a>
              )}
              {contact.socialLinks.discord && (
                <a href={contact.socialLinks.discord} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="Discord">
                  💬
                </a>
              )}
            </div>
          )}
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold font-poppins text-[var(--text-main)] mb-6">
            Send Us a Message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Input */}
              <div>
                <label className="block font-poppins font-semibold text-xs text-[var(--text-main)] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs sm:text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block font-poppins font-semibold text-xs text-[var(--text-main)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs sm:text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
                />
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block font-poppins font-semibold text-xs text-[var(--text-main)] mb-1">
                Inquiry Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs sm:text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              >
                <option value="Support">Platform Technical Support</option>
                <option value="Partnership">Sponsorship & Rewards</option>
                <option value="Authoring">Quiz Authoring Application</option>
                <option value="Prize Inquiry">Prize & Escrow Verification</option>
                <option value="Bug Report">Bug Report & Security</option>
                <option value="General">General Inquiry</option>
              </select>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block font-poppins font-semibold text-xs text-[var(--text-main)] mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                required
                placeholder="How can we help?"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs sm:text-sm focus:outline-none focus:border-[var(--color-primary-600)]"
              />
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block font-poppins font-semibold text-xs text-[var(--text-main)] mb-1">
                Message
              </label>
              <textarea
                name="message"
                rows="4"
                required
                placeholder="Describe your inquiry in detail..."
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs sm:text-sm focus:outline-none focus:border-[var(--color-primary-600)] resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Send Message</span>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default ContactPage;
