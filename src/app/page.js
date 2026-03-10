import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MarqueeBanner from '@/components/MarqueeBanner';
import About from '@/components/About';
import Features from '@/components/Features';
import Classes from '@/components/Classes';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import Community from '@/components/Community';
import Process from '@/components/Process';
import CTABanner from '@/components/CTABanner';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import { SettingsProvider } from '@/lib/settings-context';

export default function Home() {
  return (
    <SettingsProvider>
      <LoadingScreen />
      <Navbar />
      <Hero />
      <MarqueeBanner />
      <About />
      <Features />
      <Classes />
      <Gallery />
      <Testimonials />
      <Community />
      <Process />
      <CTABanner />
      <FAQ />
      <Contact />
      <Footer />
    </SettingsProvider>
  );
}
