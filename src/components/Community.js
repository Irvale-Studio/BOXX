'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';

export default function Community() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const imageX = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const textX = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section id="community" ref={sectionRef} className="relative py-32 lg:py-40">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-xs tracking-[0.4em] uppercase mb-4"
          >
            #BOXXCOMMUNITY
          </motion.p>

          <div ref={headingRef} className="overflow-hidden">
            <motion.h2
              initial={{ y: '100%' }}
              animate={headingInView ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              More Than a Gym
            </motion.h2>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side */}
          <motion.div style={{ x: imageX }} className="relative">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/studio/community.webp"
                alt="BOXX Community"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/30 to-transparent" />
            </div>

            {/* Floating BOXXRUN badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute -bottom-6 -right-4 lg:-right-8 bg-accent text-black px-6 py-4"
            >
              <p className="text-xs tracking-widest uppercase font-bold">BOXXRUN</p>
              <p className="text-[10px] tracking-wider mt-1 opacity-70">Free Run Club</p>
            </motion.div>
          </motion.div>

          {/* Text side */}
          <motion.div style={{ x: textX }} className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-white/60 text-lg leading-relaxed"
            >
              BOXX is built on three things: passion, community, and a genuine
              commitment to your growth. We believe training extends beyond physical
              results — it&apos;s about confidence, skill, and belonging.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-lg leading-relaxed"
            >
              From free community run clubs to local charity events, we&apos;re creating
              connections that go far beyond the ring. When you join BOXX, you join a
              family.
            </motion.p>

            {/* Community pillars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-6 pt-8"
            >
              {[
                { icon: '01', title: 'Connection', desc: 'Train together, grow together' },
                { icon: '02', title: 'Events', desc: 'Free community activities' },
                { icon: '03', title: 'Charity', desc: 'Giving back locally' },
              ].map((item) => (
                <div key={item.title} className="space-y-2">
                  <p className="text-accent text-2xl font-light">{item.icon}</p>
                  <p className="text-sm font-semibold tracking-wide">{item.title}</p>
                  <p className="text-xs text-white/40">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
