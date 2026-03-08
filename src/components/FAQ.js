'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'What is BOXX?',
    answer:
      'BOXX is a British-inspired boxing and fitness studio in Chiang Mai. Founded by Bert — Thai-born, UK-raised — we teach boxing fundamentals alongside functional strength training using premium imported equipment, in a luxury boutique setting.',
  },
  {
    question: 'Do I need boxing experience?',
    answer:
      'Not at all. Our classes are open to all levels, from complete beginners to experienced boxers. Our coaches guide every participant through sessions safely and at their own pace.',
  },
  {
    question: 'Do you provide gloves and wraps?',
    answer:
      'Yes, we provide both for all classes. If you train regularly, we recommend your own hand wraps for hygiene — we sell premium wraps and genuine leather gloves in the studio.',
  },
  {
    question: 'How do I book a class?',
    answer:
      'Purchase a class pack online or in-studio, which gets added to your account. Use your purchase email or booking code to log in and reserve your spot in any eligible group class.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'Classes can be cancelled or rescheduled up to 12 hours before the start time. Cancellations within 12 hours or no-shows may incur charges.',
  },
  {
    question: 'Do you offer personal training?',
    answer:
      'Yes — we offer one-to-one and small-group personal training tailored to your individual goals. Contact us directly via WhatsApp, Instagram, or LINE to arrange sessions.',
  },
];

function FAQItem({ faq, index, isOpen, onToggle }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="border-b border-white/[0.04]"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-7 md:py-8 text-left group"
      >
        <span
          className={`text-base md:text-lg transition-colors duration-300 pr-8 ${
            isOpen ? 'text-white' : 'text-white/60 group-hover:text-white/80'
          }`}
        >
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className={`text-xl ml-4 flex-shrink-0 transition-colors duration-300 ${
            isOpen ? 'text-accent' : 'text-white/20'
          }`}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-white/40 text-sm md:text-base leading-[1.8] max-w-2xl">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openId, setOpenId] = useState(null);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-28 md:py-36 lg:py-44">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-xs tracking-[0.4em] uppercase mb-5"
          >
            FAQ
          </motion.p>

          <div ref={headingRef} className="overflow-hidden">
            <motion.h2
              initial={{ y: '100%' }}
              animate={headingInView ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl font-bold tracking-tight"
            >
              Common Questions
            </motion.h2>
          </div>
        </div>

        <div>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openId === i}
              onToggle={() => setOpenId(openId === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
