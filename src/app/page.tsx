import Header from "./components/Header";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import SDGImpact from "./components/SDGImpact";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ui/ScrollProgress";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <SDGImpact />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
