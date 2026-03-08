'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 0.8]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative h-screen overflow-hidden"
    >
      {/* Background image with parallax */}
      <motion.div
        style={{ scale: imageScale, opacity: imageOpacity }}
        className="absolute inset-0"
      >
        <Image
          src="/images/studio/hero.webp"
          alt="BOXX Boxing Studio"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </motion.div>

      {/* Dark overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-black"
      />

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-accent text-[11px] md:text-xs tracking-[0.4em] uppercase mb-8"
        >
          Chiang Mai&apos;s First Luxury Boxing Studio
        </motion.p>

        {/* Main heading */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter leading-none"
          >
            BOXX
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-8 md:mt-10 text-white/50 text-base md:text-lg max-w-sm tracking-wide leading-relaxed"
        >
          Boxing &amp; strength training, done properly.
        </motion.p>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-12 h-[1px] bg-accent mt-10 origin-center"
        />

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          onClick={() => {
            document.querySelector('#classes')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mt-10 px-10 py-4 border border-white/20 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-500"
        >
          Explore Classes
        </motion.button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity: arrowOpacity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[1px] h-8 bg-gradient-to-b from-white/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}
