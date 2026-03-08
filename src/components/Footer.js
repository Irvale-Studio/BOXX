'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const footerLinks = [
  {
    title: 'Studio',
    links: [
      { name: 'About', href: '#about' },
      { name: 'Classes', href: '#classes' },
      { name: 'Community', href: '#community' },
      { name: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Classes',
    links: [
      { name: 'BOXXBEGINNER', href: '#classes' },
      { name: 'BOXXINTER', href: '#classes' },
      { name: 'BOXX&TRAIN', href: '#classes' },
      { name: 'BOXXJUNIORS', href: '#classes' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { name: 'Instagram', href: 'https://instagram.com/boxxthailand', external: true },
      { name: 'TikTok', href: 'https://tiktok.com/@boxxthailand', external: true },
      { name: 'Facebook', href: 'https://web.facebook.com/profile.php?id=61584385442693', external: true },
      { name: 'WhatsApp', href: 'https://wa.me/66934972306', external: true },
    ],
  },
];

export default function Footer() {
  const scrollTo = (href) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/brand/logo-primary-white.png"
              alt="BOXX"
              width={80}
              height={32}
              className="h-6 w-auto mb-6"
            />
            <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">
              Chiang Mai&apos;s first luxury boutique boxing &amp; personal training
              studio.
            </p>
            <p className="text-xs text-white/20 mt-4">
              89/2 Bumruang Road, Wat Ket
              <br />
              Chiang Mai 50000
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="text-xs tracking-widest uppercase text-white/30 mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/50 hover:text-accent transition-colors duration-300"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <button
                        onClick={() => scrollTo(link.href)}
                        className="text-sm text-white/50 hover:text-accent transition-colors duration-300"
                      >
                        {link.name}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} BOXX Boxing Studio. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            #BOXXCNX
          </p>
        </div>
      </div>

      {/* Large background text */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
        <p className="text-[12rem] md:text-[20rem] font-bold tracking-tighter leading-none text-white/[0.015] text-center translate-y-1/3">
          BOXX
        </p>
      </div>
    </footer>
  );
}
