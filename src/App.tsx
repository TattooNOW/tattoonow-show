import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Home } from "@/pages/Home";
import { ArtistSoftware } from "@/pages/ArtistSoftware";
import { NetworkPreview } from "@/pages/NetworkPreview";
import { RunOfShow } from "@/pages/RunOfShow";
const Slideshow = lazy(() => import("@/pages/Slideshow").then(m => ({ default: m.Slideshow })));

function Layout() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Routes>
        <Route path="/slideshow" element={<Suspense fallback={null}><Slideshow /></Suspense>} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/artist-software" element={<ArtistSoftware />} />
          <Route path="/network-preview" element={<NetworkPreview />} />
          <Route path="/run-of-show" element={<RunOfShow />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
