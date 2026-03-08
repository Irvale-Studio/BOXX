'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const images = [
  { src: '/images/studio/studio-interior.webp', alt: 'BOXX Studio Interior', caption: 'The Studio' },
  { src: '/images/studio/class-action.webp', alt: 'Boxing Class in Action', caption: 'Class in Session' },
  { src: '/images/studio/training.webp', alt: 'Training Session', caption: 'Training' },
  { src: '/images/studio/about-1.webp', alt: 'BOXX Training', caption: 'Technique Focus' },
  { src: '/images/studio/pt-session.webp', alt: 'Personal Training', caption: 'Personal Training' },
  { src: '/images/studio/class-boxing.webp', alt: 'Boxing Fundamentals', caption: 'Fundamentals' },
];

export default function Gallery() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });
  const [active, setActive] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const marqueeX = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);

  // Auto-advance slideshow
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index) => {
    setActive(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of no interaction
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const next = () => goTo((active + 1) % images.length);
  const prev = () => goTo((active - 1 + images.length) % images.length);

  return (
    <section ref={sectionRef} className="relative py-40 md:py-52 lg:py-60 bg-[#080808]">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Scrolling text marquee */}
      <div className="overflow-hidden mb-16 md:mb-20">
        <motion.div style={{ x: marqueeX }} className="flex gap-12 whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="text-7xl md:text-9xl font-bold tracking-tighter text-white/[0.025]"
            >
              BOXX STUDIO
            </span>
          ))}
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 lg:px-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-16">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-accent text-xs tracking-[0.4em] uppercase mb-5"
            >
              The Space
            </motion.p>

            <div ref={headingRef} className="overflow-hidden">
              <motion.h2
                initial={{ y: '100%' }}
                animate={headingInView ? { y: 0 } : { y: '100%' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                Inside BOXX
              </motion.h2>
            </div>
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="w-12 h-12 border border-white/10 hover:border-white/30 flex items-center justify-center transition-colors duration-300"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="w-12 h-12 border border-white/10 hover:border-white/30 flex items-center justify-center transition-colors duration-300"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main slideshow */}
        <div className="relative overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-black/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={images[active].src}
                alt={images[active].alt}
                fill
                className="object-cover"
                sizes="100vw"
              />
              {/* Gradient overlays for edge blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/60 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/40 via-transparent to-[#080808]/40" />
            </motion.div>
          </AnimatePresence>

          {/* Caption overlay */}
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2">
                  {String(active + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </p>
                <p className="text-lg md:text-xl font-medium text-white/80">
                  {images[active].caption}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="mt-6 flex gap-3">
          {images.map((image, i) => (
            <button
              key={image.src}
              onClick={() => goTo(i)}
              className={`relative flex-1 aspect-[16/9] overflow-hidden transition-all duration-500 ${
                i === active ? 'opacity-100 ring-1 ring-accent' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="16vw"
              />
            </button>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === active ? 'bg-accent w-8' : 'bg-white/15 w-2 hover:bg-white/30'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
