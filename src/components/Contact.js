'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/boxxthailand',
    label: '@boxxthailand',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@boxxthailand',
    label: '@boxxthailand',
  },
  {
    name: 'Facebook',
    href: 'https://web.facebook.com/profile.php?id=61584385442693',
    label: 'BOXX Boxing Studio',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/66934972306',
    label: '+66 93 497 2306',
  },
  {
    name: 'LINE',
    href: '#',
    label: '@boxxthailand',
  },
];

export default function Contact() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just show success state
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-32 lg:py-40">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left — Info */}
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-accent text-xs tracking-[0.4em] uppercase mb-4"
            >
              Get In Touch
            </motion.p>

            <div ref={headingRef} className="overflow-hidden">
              <motion.h2
                initial={{ y: '100%' }}
                animate={headingInView ? { y: 0 } : { y: '100%' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                Ready to
                <br />
                <span className="text-accent">Start?</span>
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-white/50 text-lg leading-relaxed max-w-md"
            >
              Whether you&apos;re a complete beginner or a seasoned boxer, we&apos;d
              love to hear from you. Drop us a message or find us on social media.
              We typically respond within 24 hours.
            </motion.p>

            {/* Contact details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-10 space-y-6"
            >
              <div>
                <p className="text-xs tracking-widest uppercase text-white/30 mb-2">
                  Location
                </p>
                <p className="text-white/70">
                  89/2 Bumruang Road, Wat Ket
                  <br />
                  Chiang Mai 50000, Thailand
                </p>
              </div>

              <div>
                <p className="text-xs tracking-widest uppercase text-white/30 mb-2">
                  Email
                </p>
                <a
                  href="mailto:hello@boxxthailand.com"
                  className="text-white/70 hover:text-accent transition-colors"
                >
                  hello@boxxthailand.com
                </a>
              </div>

              <div>
                <p className="text-xs tracking-widest uppercase text-white/30 mb-2">
                  Phone
                </p>
                <a
                  href="tel:+66934972306"
                  className="text-white/70 hover:text-accent transition-colors"
                >
                  +66 93 497 2306
                </a>
              </div>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-accent/30 transition-all duration-300"
                >
                  <span className="text-xs tracking-wider text-white/50 group-hover:text-accent transition-colors">
                    {link.name}
                  </span>
                </a>
              ))}
            </motion.div>
          </div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {submitted ? (
              <div className="h-full flex items-center justify-center border border-card-border bg-card p-12">
                <div className="text-center">
                  <div className="w-12 h-12 border border-accent rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-accent text-xl">&#10003;</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Message Sent</h3>
                  <p className="text-white/50">
                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formState.firstName}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-b border-white/10 pb-3 text-white/90 focus:border-accent focus:outline-none transition-colors placeholder:text-white/20"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formState.lastName}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-b border-white/10 pb-3 text-white/90 focus:border-accent focus:outline-none transition-colors placeholder:text-white/20"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white/90 focus:border-accent focus:outline-none transition-colors placeholder:text-white/20"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white/90 focus:border-accent focus:outline-none transition-colors placeholder:text-white/20"
                    placeholder="+66 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                    Interested In
                  </label>
                  <select
                    name="interest"
                    value={formState.interest}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white/90 focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0a0a0a]">
                      Select an option
                    </option>
                    <option value="classes" className="bg-[#0a0a0a]">
                      Group Classes
                    </option>
                    <option value="pt" className="bg-[#0a0a0a]">
                      Personal Training
                    </option>
                    <option value="other" className="bg-[#0a0a0a]">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white/90 focus:border-accent focus:outline-none transition-colors resize-none placeholder:text-white/20"
                    placeholder="How can we help?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-accent text-black text-sm tracking-widest uppercase font-semibold hover:bg-accent-dim transition-colors duration-300"
                >
                  Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
