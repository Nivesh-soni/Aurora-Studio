import { SignedIn, UserButton } from "@clerk/clerk-react";
import { Clapperboard } from "lucide-react";

export default function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#07090e]/85 px-5 backdrop-blur-xl sm:px-8">
      <div className="flex items-center text-xs text-slate-500"><span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-cyan-500 to-indigo-500 text-white md:hidden"><Clapperboard size={15} /></span><span className="font-mono">workspace</span><span className="mx-2">/</span><span className="font-semibold uppercase tracking-wide text-cyan-400">Projects</span></div>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: "h-9 w-9 rounded-xl border border-white/10 shadow-md" } }}
        />
      </SignedIn>
    </header>
  );
}
