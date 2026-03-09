'use client';

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
    <footer className="relative border-t border-white/[0.04]">
      <div className="max-w-[1600px] mx-auto px-10 lg:px-20 pt-24 md:pt-28 pb-16">
        {/* Top row — Logo + tagline + link columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-10">
          {/* Brand */}
          <div className="md:col-span-5 lg:col-span-5">
            <Image
              src="/images/brand/logo-primary-white.png"
              alt="BOXX"
              width={120}
              height={48}
              className="h-8 md:h-10 w-auto mb-6"
            />
            <p className="text-base text-white/30 leading-[1.8] max-w-[340px]">
              Chiang Mai&apos;s luxury boutique boxing and personal training
              studio. UK-qualified coaches, intimate classes, premium space.
            </p>
          </div>

          {/* Link columns */}
          <div className="md:col-span-7 lg:col-span-7 grid grid-cols-3 gap-8">
            {footerLinks.map((col) => (
              <div key={col.title}>
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-6">
                  {col.title}
                </p>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/40 hover:text-accent transition-colors duration-300"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <button
                          onClick={() => scrollTo(link.href)}
                          className="text-sm text-white/40 hover:text-accent transition-colors duration-300"
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
        </div>

        {/* Divider */}
        <div className="mt-20 pt-10 border-t border-white/[0.04]">
          {/* Contact details row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 mb-2">Address</p>
              <p className="text-sm text-white/30 leading-relaxed">
                89/2 Bumruang Road, Wat Ket<br />
                Chiang Mai 50000, Thailand
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 mb-2">Email</p>
              <a href="mailto:hello@boxxthailand.com" className="text-sm text-white/30 hover:text-accent transition-colors">
                hello@boxxthailand.com
              </a>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 mb-2">Phone</p>
              <a href="tel:+66934972306" className="text-sm text-white/30 hover:text-accent transition-colors">
                +66 93 497 2306
              </a>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.03]">
            <p className="text-[11px] text-white/15 tracking-wider">
              &copy; {new Date().getFullYear()} BOXX Boxing Studio. All rights reserved.
            </p>
            <p className="text-[11px] text-white/15 tracking-[0.3em]">
              #BOXXCNX
            </p>
          </div>
        </div>
      </div>

      {/* Large background text */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
        <p className="text-[14rem] md:text-[22rem] font-bold tracking-tighter leading-none text-white/[0.012] text-center translate-y-1/3">
          BOXX
        </p>
      </div>
    </footer>
  );
}
