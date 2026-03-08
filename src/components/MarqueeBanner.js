'use client';

import { motion } from 'framer-motion';

export default function MarqueeBanner() {
  const items = [
    'BOXING',
    'STRENGTH',
    'TECHNIQUE',
    'COMMUNITY',
    'DISCIPLINE',
    'POWER',
  ];

  return (
    <div className="relative py-10 md:py-12 border-y border-white/5 overflow-hidden">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="flex items-center gap-12 md:gap-16 whitespace-nowrap"
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-12 md:gap-16">
            <span className="text-sm md:text-base tracking-[0.5em] uppercase text-white/10 font-light">
              {item}
            </span>
            <span className="text-accent/20 text-[8px]">&#9670;</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
