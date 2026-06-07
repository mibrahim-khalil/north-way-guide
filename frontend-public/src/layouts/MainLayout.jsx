import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import HeroSlider from "../components/common/HeroSlider";
import { heroByRoute } from "../utils/heroConfig";

export default function MainLayout() {
  const location = useLocation();
  const hero = heroByRoute(location.pathname);

  return (
    <>
      <Header />

      {/* Hero stays full-bleed editorial */}
      <HeroSlider {...hero} />

      {/* Main content: clean white canvas + consistent spacing */}
      <main className="nwMain">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </>
  );
}