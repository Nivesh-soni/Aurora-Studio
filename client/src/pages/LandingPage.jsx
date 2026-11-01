import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Showcase from "../components/landing/Showcase";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-clip font-sans">

      {/* Background ambient radial gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-indigo-950/20 blur-[130px] rounded-full" />
        <div className="absolute top-[65%] -right-48 w-[600px] h-[600px] bg-cyan-950/20 blur-[130px] rounded-full" />
      </div>

      <Navbar />
      <Hero />
      <Showcase />
      <Features />
      <HowItWorks />
      <CTASection />
      <Footer />

    </div>
  );
}