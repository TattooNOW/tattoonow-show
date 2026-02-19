import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RunOfShow } from "@/pages/RunOfShow";
const Slideshow = lazy(() => import("@/pages/Slideshow").then(m => ({ default: m.Slideshow })));
const NotesPopout = lazy(() => import("@/pages/NotesPopout").then(m => ({ default: m.NotesPopout })));

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
        <Route path="/notes" element={<Suspense fallback={null}><NotesPopout /></Suspense>} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/run-of-show" replace />} />
          <Route path="/run-of-show" element={<RunOfShow />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
