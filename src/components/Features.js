'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const features = [
  {
    id: 'technique',
    number: '01',
    title: 'Proper Technique',
    description:
      'UK-qualified coaches who prioritise form and fundamentals. Every punch, every movement, done right from day one.',
    detail: 'Certified in British boxing standards',
  },
  {
    id: 'intimate',
    number: '02',
    title: 'Intimate Classes',
    description:
      'Maximum 6 people per session. You\'re never just a number. You get real coaching, real attention, and 1:1 padwork in every class.',
    detail: 'Small groups, maximum attention',
  },
  {
    id: 'luxury',
    number: '03',
    title: 'Premium Space',
    description:
      'A purpose-built studio designed to inspire. Premium imported equipment, clean lines, and an atmosphere that makes you want to show up.',
    detail: 'Boutique studio, imported equipment',
  },
  {
    id: 'inclusive',
    number: '04',
    title: 'All Levels Welcome',
    description:
      'Whether you\'ve never thrown a punch or you\'re preparing for a fight, there\'s a place for you at BOXX.',
    detail: 'Beginners to experienced boxers',
  },
];

function FeatureCard({ feature, index, isActive, onHover }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      onMouseEnter={() => onHover(feature.id)}
      onMouseLeave={() => onHover(null)}
      className={`group relative flex-1 min-w-0 min-h-[280px] border-l transition-all duration-700 cursor-default ${
        isActive
          ? 'border-accent flex-[2.5] pl-8 pr-8 py-10'
          : 'border-white/10 hover:border-white/20 flex-1 pl-6 pr-4 py-10'
      }`}
    >
      <span
        className={`text-[11px] tracking-[0.3em] transition-colors duration-500 ${
          isActive ? 'text-accent' : 'text-white/15'
        }`}
      >
        {feature.number}
      </span>

      <h3
        className={`text-lg md:text-2xl font-bold tracking-tight mt-6 transition-colors duration-500 ${
          isActive ? 'text-white' : 'text-white/40'
        }`}
      >
        {feature.title}
      </h3>

      {/* Description — only visible when active */}
      <div
        className={`overflow-hidden transition-all duration-700 ${
          isActive ? 'max-h-48 opacity-100 mt-6' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-white/45 text-sm leading-[1.8]">
          {feature.description}
        </p>
        <div className="flex items-center gap-3 mt-6">
          <div className="w-5 h-[1px] bg-accent/50" />
          <span className="text-[10px] tracking-[0.2em] uppercase text-accent/60">
            {feature.detail}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const [activeId, setActiveId] = useState('technique');
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-34 md:py-44 lg:py-52 bg-[#080808]">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-10 lg:px-20">
        {/* Section header */}
        <div className="mb-20 md:mb-24">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-xs tracking-[0.4em] uppercase mb-5"
          >
            Why BOXX
          </motion.p>

          <div ref={headingRef} className="overflow-hidden">
            <motion.h2
              initial={{ y: '100%' }}
              animate={headingInView ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              The BOXX Difference
            </motion.h2>
          </div>
        </div>

        {/* Expanding flex cards — desktop */}
        <div className="hidden md:flex gap-0">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={i}
              isActive={activeId === feature.id}
              onHover={setActiveId}
            />
          ))}
        </div>

        {/* Mobile stack */}
        <div className="md:hidden space-y-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-l border-accent/30 pl-6 py-4"
            >
              <span className="text-[11px] tracking-[0.3em] text-accent">{feature.number}</span>
              <h3 className="text-xl font-bold mt-3">{feature.title}</h3>
              <p className="text-white/45 text-sm leading-[1.8] mt-3">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
