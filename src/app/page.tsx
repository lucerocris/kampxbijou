import Image from 'next/image';
import Link from "next/link";

export default function Home() {
  return (
      <main
          className="min-h-screen flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: '#f8f5f2',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)]" />

        <div className="relative z-10 gap-2 w-full max-w-[500px] p-6 flex flex-col items-center justify-center min-h-[600px]">

          {/* 1. Header Section */}
          <header className="text-center w-full mb-8 relative z-20">
            <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs text-gray-500 font-semibold">
              Charm Bracelet Workshop
            </p>
          </header>

          {/* 2. Main Title Typography */}
          {/* Static container keeps layout stable */}
          <section className="w-full flex justify-center items-center h-32 mb-10 relative z-10">
            <div className="relative w-[300px]">
              <Image
                  src="/logoHeader.png"
                  alt="Beads and Brew"
                  width={300}
                  height={300}
                  priority
                  className="w-full h-auto object-contain drop-shadow-sm opacity-90 mix-blend-multiply transform"
              />
            </div>
          </section>

          {/* 3. Register Now Button */}
          <section className="w-full flex justify-center mb-8 relative z-20">
            <Link
                href="/register"
                className="bg-[#920d25] hover:bg-[#7a0b1f] text-white font-bold py-3.5 px-10 rounded-full text-base uppercase tracking-wide shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 block text-center"
            >
              Register Now
            </Link>
          </section>

          {/* 4. Event Details */}
          <section className="text-center space-y-3 mb-8 w-full relative z-20">
            <h2 className="text-base md:text-lg font-bold text-gray-800 tracking-wide">
              February 14, 2026 <span className="text-[#920d25] mx-1">|</span> 2:00 - 4:00 PM
            </h2>
            <p className="text-xs md:text-sm text-gray-600 px-4 leading-relaxed font-medium">
              16 Molave St., Cebu City <br className="block sm:hidden" />
              <span className="hidden sm:inline text-gray-400 mx-2">|</span>
              Kamp Craft Coffee and Roastery
            </p>
          </section>

          {/* 5. Footer Logos (Kamp x Bijou) */}
          <footer className="w-full flex justify-center pt-4 pb-2 relative z-20">
            {/* FIX:
             - 'h-12' creates a small, static box in the layout flow.
             - The content above will not move.
          */}
            <div className="relative w-32 md:w-40 h-12 flex items-center justify-center">
              <Image
                  src="/kampxbijou.png"
                  alt="Kamp x Bijou"
                  width={200}
                  height={100}
                  // FIX: 'scale-150' makes the image look big, but the browser still thinks it fits inside the h-12 box
                  className="w-full h-auto object-contain opacity-90 mix-blend-multiply transform scale-150 origin-center"
              />
            </div>
          </footer>
        </div>
      </main>
  );
}