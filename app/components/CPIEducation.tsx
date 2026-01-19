'use client';

import { CATEGORY_WEIGHTS } from '../constants';

export const CPIEducation = () => {
  return (
    <div className="mt-6 md:mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 md:p-8 shadow-xl">
      <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-6 md:mb-8 text-center">Understanding the Consumer Price Index</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="space-y-4 md:space-y-6">
          {/* What is CPI */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">What is CPI?</h3>
            </div>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Measures the average change in prices paid by consumers for a basket of goods and services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Key indicator of inflation and cost of living</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Base year is 2012 (CPI = 100)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Values above 100 indicate price increases since 2012</span>
              </li>
            </ul>
          </div>

          {/* How is it calculated */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">How is it Calculated?</h3>
            </div>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Uses the Laspeyres formula to compare prices</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Compares current prices to base year prices for a fixed basket</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                <div className="text-base text-slate-300">
                  <span className="block mb-1">Formula:</span>
                  <code className="text-sm bg-slate-800 px-2 py-1 rounded text-purple-300">CPI = (Cost in current period / Cost in base period) × 100</code>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Data collected monthly from urban and rural areas across all states</span>
              </li>
            </ul>
          </div>

          {/* Rural vs Urban */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Rural vs Urban Indices</h3>
            </div>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Different weights reflecting consumption patterns</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300"><strong className="text-slate-200">Rural:</strong> Higher food weight (~54%)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300"><strong className="text-slate-200">Urban:</strong> Includes Housing, higher misc weights</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300"><strong className="text-slate-200">Combined:</strong> Weighted average of both</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          {/* Category Weights */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Category Weights (Combined)</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4 ml-1">Each category contributes differently based on household spending:</p>
            <div className="space-y-3 ml-1">
              {CATEGORY_WEIGHTS.map((item) => (
                <div key={item.name} className="flex items-start gap-3 py-1.75 border-b border-slate-700/30 last:border-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-200">{item.name}</span>
                      <span className="text-sm font-semibold text-slate-100">{item.weight}%</span>
                    </div>
                    <span className="text-xs text-slate-500">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reading CPI Values */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">How to Read CPI Values</h3>
            </div>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300"><strong className="text-slate-200">CPI = 100:</strong> Prices same as base year (2012)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300"><strong className="text-slate-200">CPI = 150:</strong> Prices are 50% higher than 2012</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300"><strong className="text-slate-200">CPI = 190:</strong> Prices are 90% higher than 2012</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                <span className="text-base text-slate-300">Compare across time to see inflation trends</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
