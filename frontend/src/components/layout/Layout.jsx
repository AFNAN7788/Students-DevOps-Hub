import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";

export default function Layout() {
  return (
    <div className="min-h-screen bg-navy-50 text-slate-200 selection:bg-primary-500/30 selection:text-white">
      <Header />
      <main className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
