import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { apiGetSiteSettings, apiSubmitContactMessage } from '../services/api';

export const ContactPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    category: 'Support',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

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
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          category: 'Support',
          subject: '',
          message: ''
        });
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

          {/* Social Links Row with Official Brand Logos */}
          {contact.socialLinks && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 shadow-sm flex items-center justify-around">
              {contact.socialLinks.twitter && (
                <a
                  href={contact.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center hover:scale-110 hover:border-sky-500 transition-all shadow-xs"
                  title="Twitter / X"
                >
                  <svg className="w-5 h-5 fill-current text-[var(--text-main)] hover:text-sky-500 transition-colors" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {contact.socialLinks.github && (
                <a
                  href={contact.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center hover:scale-110 hover:border-slate-500 transition-all shadow-xs"
                  title="GitHub"
                >
                  <svg className="w-5 h-5 fill-current text-[var(--text-main)] hover:text-slate-400 transition-colors" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                </a>
              )}
              {contact.socialLinks.linkedin && (
                <a
                  href={contact.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center hover:scale-110 hover:border-blue-600 transition-all shadow-xs"
                  title="LinkedIn"
                >
                  <svg className="w-5 h-5 fill-current text-[var(--text-main)] hover:text-blue-600 transition-colors" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4z"/>
                  </svg>
                </a>
              )}
              {contact.socialLinks.discord && (
                <a
                  href={contact.socialLinks.discord}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center hover:scale-110 hover:border-indigo-500 transition-all shadow-xs"
                  title="Discord"
                >
                  <svg className="w-5 h-5 fill-current text-[var(--text-main)] hover:text-indigo-500 transition-colors" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
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
