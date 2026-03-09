'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    quote:
      "Bert is more than a PT. He's a coach, a guide, and a partner in your growth.",
    author: 'Client Review',
  },
  {
    quote:
      'Got me fighting fit for my wedding 10 years ago and I never looked back.',
    author: 'Long-time Client',
  },
  {
    quote: 'Always gives 110% to every person he is training.',
    author: 'BOXX Member',
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-34 md:py-44 lg:py-56 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Large decorative quote mark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] md:text-[28rem] leading-none text-white/[0.015] font-serif select-none pointer-events-none">
        &ldquo;
      </div>

      <div ref={ref} className="max-w-[1100px] mx-auto px-10 lg:px-20 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          className="text-accent text-xs tracking-[0.4em] uppercase mb-16 md:mb-20"
        >
          What People Say
        </motion.p>

        {/* Quote carousel */}
        <div className="relative min-h-[280px] md:min-h-[260px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-full px-4"
            >
              <p className="text-2xl md:text-3xl lg:text-5xl font-light tracking-tight leading-[1.4] text-white/85">
                &ldquo;{testimonials[active].quote}&rdquo;
              </p>
              <footer className="mt-10 md:mt-12">
                <div className="w-8 h-[1px] bg-accent mx-auto mb-5" />
                <cite className="text-[11px] tracking-[0.3em] uppercase text-white/30 not-italic">
                  {testimonials[active].author}
                </cite>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-3 mt-20">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'bg-accent w-8' : 'bg-white/15 w-1.5 hover:bg-white/30'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
