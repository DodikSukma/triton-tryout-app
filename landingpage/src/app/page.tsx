import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import StatsBand from '@/components/sections/StatsBand'
import Programs from '@/components/sections/Programs'
import Alumni from '@/components/sections/Alumni'
import Method from '@/components/sections/Method'
import Testimonials from '@/components/sections/Testimonials'
import Gallery from '@/components/sections/Gallery'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import CTABanner from '@/components/sections/CTABanner'
import Footer from '@/components/sections/Footer'
import PageLoadOverlay from '@/components/ui/PageLoadOverlay'

// Statically generated at build time for fast first paint and SEO.
export const dynamic = 'force-static'

export default function LandingPage() {
  return (
    <div className="bg-white font-inter text-slate-700 antialiased">
      <PageLoadOverlay />
      <Navbar />
      <main>
        <Hero />
        <StatsBand />
        <Programs />
        <Alumni />
        <Method />
        <Testimonials />
        <Gallery />
        <Pricing />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
