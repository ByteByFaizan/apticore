import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import SDGImpact from "./components/SDGImpact";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
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
