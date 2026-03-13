"use client";

export default function Header() {
  return (
    <header className="border-b border-white/5 bg-black/30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-bold text-sm">
            OFT
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">
              OFT Bridge
            </h1>
            <p className="text-xs text-gray-500">Powered by LayerZero V2</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://testnet.layerzeroscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            LayerZero Scan
          </a>
          <div className="px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-xs text-yellow-400 font-medium">Testnet</span>
          </div>
        </div>
      </div>
    </header>
  );
}
