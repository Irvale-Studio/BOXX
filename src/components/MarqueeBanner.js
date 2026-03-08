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
    <div className="relative py-8 border-y border-white/5 overflow-hidden">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="flex items-center gap-8 whitespace-nowrap"
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-8">
            <span className="text-sm tracking-[0.5em] uppercase text-white/15 font-light">
              {item}
            </span>
            <span className="text-accent/30 text-xs">&#9670;</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
