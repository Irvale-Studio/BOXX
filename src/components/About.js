'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';

function RevealText({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        initial={{ y: '100%' }}
        animate={inView ? { y: 0 } : { y: '100%' }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section id="about" ref={sectionRef} className="relative py-28 md:py-36 lg:py-44">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn>
          <p className="text-accent text-xs tracking-[0.4em] uppercase mb-20 md:mb-24">
            Our Story
          </p>
        </FadeIn>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-start">
          {/* Left — Text */}
          <div>
            <RevealText>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Born in Thailand.
                <br />
                <span className="text-accent">Trained in Britain.</span>
              </h2>
            </RevealText>

            <FadeIn delay={0.2}>
              <p className="text-white/50 text-base md:text-lg leading-[1.8] max-w-lg mt-10">
                Founded by Bert — born in Thailand and raised in Glasgow — BOXX brings
                over a decade of UK personal training expertise to Chiang Mai. After
                qualifying in Central London and building a career across boxing,
                strength training, and nutrition, Bert returned to Thailand with one
                mission.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="text-white/50 text-base md:text-lg leading-[1.8] max-w-lg mt-6">
                To create a space where Western boxing standards meet Thai warmth. Where
                technique comes first, classes stay intimate, and every person who walks
                through the door feels like they belong.
              </p>
            </FadeIn>

            {/* Stats */}
            <FadeIn delay={0.4}>
              <div className="grid grid-cols-3 gap-8 mt-14 pt-10 border-t border-white/[0.06]">
                {[
                  { number: '10+', label: 'Years Experience' },
                  { number: '6', label: 'Max Per Class' },
                  { number: '4', label: 'Class Types' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl md:text-4xl font-bold text-accent">
                      {stat.number}
                    </p>
                    <p className="text-[10px] md:text-xs tracking-wider uppercase text-white/30 mt-2">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right — Image with parallax */}
          <div className="relative mt-4 lg:mt-0">
            <motion.div style={{ y: imageY }} className="relative">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/studio/about-bert.webp"
                  alt="Bert, founder of BOXX"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              </div>

              {/* Floating quote card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute -bottom-6 -left-4 lg:-left-12 bg-card border border-card-border p-6 lg:p-8 max-w-[300px]"
              >
                <p className="text-sm text-white/60 italic leading-[1.8]">
                  &ldquo;More than a PT. He&apos;s a coach, a guide, and a partner in
                  your growth.&rdquo;
                </p>
                <div className="w-8 h-[1px] bg-accent mt-5" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
