'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Get in Touch',
    description: 'Message us on WhatsApp, Instagram, LINE — or fill out the form below. Tell us about your goals.',
  },
  {
    number: '02',
    title: 'Choose Your Class',
    description: 'Pick from beginner boxing, intermediate, hybrid training, or personal sessions. We\'ll recommend the best fit.',
  },
  {
    number: '03',
    title: 'Book & Show Up',
    description: 'Grab a class pack, book your spot online, and walk in. We provide gloves and wraps — just bring yourself.',
  },
  {
    number: '04',
    title: 'Train & Grow',
    description: 'Get proper coaching, join the community, and watch yourself transform. Every session, every round — you\'re getting better.',
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
      className="group relative flex gap-8 py-10 border-b border-white/5 last:border-0"
    >
      {/* Number */}
      <div className="flex-shrink-0">
        <span className="text-5xl md:text-6xl font-bold text-white/[0.06] group-hover:text-accent/20 transition-colors duration-500">
          {step.number}
        </span>
      </div>

      {/* Content */}
      <div className="pt-2">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-accent transition-colors duration-500">
          {step.title}
        </h3>
        <p className="text-white/40 mt-2 leading-relaxed max-w-md">
          {step.description}
        </p>
      </div>

      {/* Connecting line */}
      {index < steps.length - 1 && (
        <div className="absolute left-6 bottom-0 w-[1px] h-10 bg-gradient-to-b from-white/5 to-transparent translate-y-full" />
      )}
    </motion.div>
  );
}

export default function Process() {
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-32 lg:py-40">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr,2fr] gap-16 lg:gap-24">
          {/* Left — sticky header */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-accent text-xs tracking-[0.4em] uppercase mb-4"
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
              className="mt-4 text-white/40 max-w-sm"
            >
              Getting started at BOXX is simple. No complicated sign-ups, no intimidation — just great coaching from day one.
            </motion.p>
          </div>

          {/* Right — steps */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <StepItem key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
