'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Get in Touch',
    description: 'Message us on WhatsApp, Instagram, LINE, or fill out the form below. Tell us about your goals.',
  },
  {
    number: '02',
    title: 'Choose Your Class',
    description: 'Pick from beginner boxing, intermediate, hybrid training, or personal sessions. We\'ll recommend the best fit.',
  },
  {
    number: '03',
    title: 'Book & Show Up',
    description: 'Grab a class pack, book your spot online, and walk in. We provide gloves and wraps, so just bring yourself.',
  },
  {
    number: '04',
    title: 'Train & Grow',
    description: 'Get proper coaching, join the community, and watch yourself transform. Every session, every round, you\'re getting better.',
  },
];

function StepItem({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="group relative grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-6 py-12 md:py-14 border-b border-white/[0.04] last:border-0"
    >
      {/* Number */}
      <div>
        <span className="text-4xl md:text-5xl font-bold text-white/[0.06] group-hover:text-accent/20 transition-colors duration-500">
          {step.number}
        </span>
      </div>

      {/* Content */}
      <div className="pt-1">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-accent transition-colors duration-500">
          {step.title}
        </h3>
        <p className="text-white/40 mt-4 leading-[1.8] max-w-lg text-sm md:text-base">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function Process() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-40 md:py-52 lg:py-60 bg-[#080808]">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-10 lg:px-20">
        <div className="grid lg:grid-cols-[1fr,2fr] gap-16 lg:gap-28">
          {/* Left — sticky header */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-accent text-xs tracking-[0.4em] uppercase mb-5"
            >
              How It Works
            </motion.p>

            <div ref={headingRef} className="overflow-hidden">
              <motion.h2
                initial={{ y: '100%' }}
                animate={headingInView ? { y: 0 } : { y: '100%' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-5xl font-bold tracking-tight"
              >
                Your First
                <br />
                <span className="text-accent">Session</span>
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-white/35 max-w-sm leading-relaxed"
            >
              Getting started at BOXX is simple. No complicated sign-ups, no intimidation, just great coaching from day one.
            </motion.p>
          </div>

          {/* Right — steps */}
          <div>
            {steps.map((step, i) => (
              <StepItem key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
