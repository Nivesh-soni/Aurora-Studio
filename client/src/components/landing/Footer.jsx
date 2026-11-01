import {
  ArrowUpRight,
  Sparkles,
  Heart,
} from "lucide-react";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Editor", href: "#showcase" },
  { label: "Get Started", href: "#home" },
];

const resourceLinks = [
  { label: "Documentation", href: "#" },
  { label: "Tutorials", href: "#" },
  { label: "Help Center", href: "#" },
  { label: "What's New", href: "#" },
];

const companyLinks = [
  { label: "About Us", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export default function Footer() {
  return (
    <footer
      id="about"
      className="relative mt-20 border-t border-white/5 bg-[#07090e] overflow-hidden"
    >
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/4 w-96 h-64 bg-cyan-500/4 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-64 bg-violet-500/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 py-16 lg:py-20">
          {/* Brand */}
          <div className="lg:col-span-5">
            <a href="#home" className="inline-flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-cyan-500 to-indigo-500 p-px shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#07090e] rounded-[7px] flex items-center justify-center">
                  <img
                    src="Logo-without-bg.png"
                    className="text-cyan-400 group-hover:rotate-6 transition-transform"
                    alt=""
                  />
                </div>
              </div>
              <span className="font-semibold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Aurora{" "}
                <span className="text-slate-400 font-normal">Studio</span>
              </span>
            </a>

            <p className="mt-6 max-w-sm text-sm text-slate-400 leading-7">
              Your creativity deserves better tools. Create, edit, and bring
              your stories to life with a powerful video editing experience
              built for the web.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300">
                Made for creators, by creators.
              </span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-6">Product</h3>

            <ul className="space-y-4">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-6">Resources</h3>

            <ul className="space-y-4">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-white mb-6">Company</h3>

            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            © {new Date().getFullYear()} Aurora Studio. Crafted with
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            for creators.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="GitHub"
              className="w-9 h-9 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all"
            >
              <i className="fa-brands fa-github"></i>
            </a>

            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>

            <a
              href="#"
              aria-label="YouTube"
              className="w-9 h-9 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all"
            >
              <i className="fa-brands fa-youtube"></i>
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Built for the next generation of creators
          </div>
        </div>
      </div>
    </footer>
  );
}
