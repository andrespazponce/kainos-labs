// app/page.js
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import ProductsSection from '@/components/sections/ProductsSection';
import ServicesSection from '@/components/sections/ServicesSection';
import AchievementsSection from '@/components/sections/AchievementsSection';
import ClientPortal from '@/components/sections/ClientPortal';
import { siteConfig } from '@/lib/site-config';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection config={siteConfig} />
        <div className="line-divider" />
        <ProductsSection products={siteConfig.products} />
        <div className="line-divider" />
        <ServicesSection services={siteConfig.services} />
        <div className="line-divider" />
        <AchievementsSection achievements={siteConfig.achievements} />
        <div className="line-divider" />
        <ClientPortal />
      </main>
      <Footer />
    </>
  );
}
