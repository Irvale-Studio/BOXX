'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const classes = [
  {
    id: 'beginner',
    name: 'BOXXBEGINNER',
    level: 'Beginner',
    duration: '55 min',
    capacity: '6 max',
    rounds: '10 rounds',
    image: '/images/studio/class-boxing.webp',
    description:
      'Perfect for first-timers or anyone new to boxing. Move through shadow boxing, bag work, and 1:1 padwork with a focus on both offence and defence.',
    features: ['Shadow boxing', 'Bag work', '1:1 Padwork', 'Technique focus'],
  },
  {
    id: 'intermediate',
    name: 'BOXXINTER',
    level: 'Intermediate',
    duration: '55 min',
    capacity: '6 max',
    rounds: '12 rounds',
    image: '/images/studio/class-action.webp',
    description:
      'For those with a basic understanding of boxing fundamentals. Higher pace, higher intensity, with advanced combinations and defensive drills.',
    features: ['Advanced combos', 'Higher intensity', 'Defensive drills', 'Sparring prep'],
  },
  {
    id: 'train',
    name: 'BOXX&TRAIN',
    level: 'All Levels',
    duration: '55 min',
    capacity: '6 max',
    rounds: 'Hybrid',
    image: '/images/studio/class-train.webp',
    description:
      'The best of both worlds. Boxing meets strength and conditioning — weights, kettlebells, bodyweight training. Build muscle, burn fat, get fit.',
    features: ['Boxing drills', 'Kettlebells', 'Strength work', 'Fat burning'],
  },
  {
    id: 'juniors',
    name: 'BOXXJUNIORS',
    level: 'Ages 9+',
    duration: '55 min',
    capacity: '10 max',
    rounds: 'Fun focused',
    image: '/images/studio/class-juniors.webp',
    description:
      'Boxing in a safe, fun, and supportive environment. Sessions build fitness, coordination, and discipline while teaching fundamentals.',
    features: ['Coordination', 'Discipline', 'Fitness', 'Fun environment'],
  },
];

function ClassCard({ cls, index, isExpanded, onToggle }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggle}
      className={`group cursor-pointer relative overflow-hidden border transition-all duration-700 ${
        isExpanded
          ? 'border-accent/30 bg-card'
          : 'border-card-border bg-card/50 hover:border-white/10'
      }`}
    >
      {/* Image section */}
      <div className={`relative overflow-hidden transition-all duration-700 ${
        isExpanded ? 'h-64 md:h-80' : 'h-48 md:h-56'
      }`}>
        <Image
          src={cls.image}
          alt={cls.name}
          fill
          className={`object-cover transition-transform duration-700 ${
            isExpanded ? 'scale-105' : 'group-hover:scale-105'
          }`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        {/* Level badge */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] tracking-widest uppercase text-accent">
            {cls.level}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
            {cls.name}
          </h3>
          <div className="flex gap-4 mt-2">
            {[cls.duration, cls.capacity, cls.rounds].map((detail) => (
              <span key={detail} className="text-xs tracking-wider text-white/50">
                {detail}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <p className="text-white/60 leading-relaxed">{cls.description}</p>

              <div className="grid grid-cols-2 gap-3">
                {cls.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent rounded-full" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs tracking-widest uppercase text-accent hover:text-accent-dim transition-colors"
                >
                  Get in touch &rarr;
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand indicator */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-card-border">
        <span className="text-xs tracking-wider text-white/30">
          {isExpanded ? 'Click to collapse' : 'Click to learn more'}
        </span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-white/30 text-lg"
        >
          &#x2304;
        </motion.span>
      </div>
    </motion.div>
  );
}

export default function Classes() {
  const [expandedId, setExpandedId] = useState(null);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  return (
    <section id="classes" className="relative py-32 lg:py-40">
      {/* Background accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-xs tracking-[0.4em] uppercase mb-4"
          >
            Our Classes
          </motion.p>

          <div ref={headingRef} className="overflow-hidden">
            <motion.h2
              initial={{ y: '100%' }}
              animate={headingInView ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Find Your Fight
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-white/50 mt-4 max-w-lg text-lg"
          >
            Small-group sessions. Maximum 6 people. Every class delivers proper
            technique, real conditioning, and 1:1 attention from UK-qualified coaches.
          </motion.p>
        </div>

        {/* Class cards grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {classes.map((cls, i) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              index={i}
              isExpanded={expandedId === cls.id}
              onToggle={() =>
                setExpandedId(expandedId === cls.id ? null : cls.id)
              }
            />
          ))}
        </div>

        {/* Personal training callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-12 relative overflow-hidden border border-card-border bg-card/50 p-8 md:p-12"
        >
          <div className="grid md:grid-cols-[1fr,auto] gap-8 items-center">
            <div>
              <p className="text-accent text-xs tracking-[0.4em] uppercase mb-3">
                1-to-1 &amp; Small Group
              </p>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                Personal Training
              </h3>
              <p className="text-white/50 max-w-lg">
                Tailored sessions built around your goals. Whether it&apos;s boxing
                technique, strength, weight loss, or fight preparation — get a
                programme designed specifically for you.
              </p>
            </div>
            <button
              onClick={() => {
                document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3.5 bg-accent text-black text-sm tracking-widest uppercase font-semibold hover:bg-accent-dim transition-colors duration-300 whitespace-nowrap"
            >
              Enquire Now
            </button>
          </div>

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-accent/20" />
        </motion.div>
      </div>
    </section>
  );
}
