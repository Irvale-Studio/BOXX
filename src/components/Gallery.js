'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';

const images = [
  { src: '/images/studio/studio-interior.webp', alt: 'BOXX Studio Interior', span: 'col-span-2 row-span-2' },
  { src: '/images/studio/class-action.webp', alt: 'Boxing Class in Action', span: '' },
  { src: '/images/studio/training.webp', alt: 'Training Session', span: '' },
  { src: '/images/studio/about-1.webp', alt: 'BOXX Training', span: '' },
  { src: '/images/studio/pt-session.webp', alt: 'Personal Training', span: 'col-span-2' },
];

function GalleryImage({ image, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden group ${image.span}`}
    >
      <div className="relative w-full h-full min-h-[200px] md:min-h-[250px]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
        <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p className="text-xs tracking-widest uppercase text-white/80">
            {image.alt}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Gallery() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const marqueeX = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);

  return (
    <section ref={sectionRef} className="relative py-32 lg:py-40">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Scrolling text marquee */}
      <div className="overflow-hidden mb-16">
        <motion.div style={{ x: marqueeX }} className="flex gap-8 whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="text-7xl md:text-9xl font-bold tracking-tighter text-white/[0.03]"
            >
              BOXX STUDIO
            </span>
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-xs tracking-[0.4em] uppercase mb-4"
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

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[200px] md:auto-rows-[250px]">
          {images.map((image, i) => (
            <GalleryImage key={image.src} image={image} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
