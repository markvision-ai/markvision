import React from 'react';
import { motion } from 'framer-motion';
import { Send, Rocket, Instagram, Youtube, Globe, Check, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface FactoryDispatchProps {
  onManualSend: () => void;
  onAutoStart: () => void;
  isReady: boolean;
}

export const FactoryDispatch = ({ onManualSend, onAutoStart, isReady }: FactoryDispatchProps) => {
  return (
    <div className="h-[140px] bg-white border-t border-slate-200 flex relative z-20">
      
      {/* Label */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
        <div className={cn(
          "px-6 py-1 border rounded-full backdrop-blur-md shadow-lg transition-all duration-500 flex items-center gap-2",
          isReady 
            ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
            : "bg-slate-50 border-slate-200 text-slate-400"
        )}>
          {isReady ? <ShieldCheck size={14} /> : <Lock size={14} />}
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
            {isReady ? "СИСТЕМЫ ГОТОВЫ" : "ОЖИДАНИЕ СБОРКИ"}
          </span>
        </div>
      </div>

      {/* LEFT: Manual Mode */}
      <div className="w-1/2 p-6 flex items-center justify-between border-r border-slate-200 bg-slate-50/50 relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
         
         <div className="flex items-center gap-5 pl-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
               <Send className="text-white w-6 h-6 ml-0.5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">РУЧНОЙ КОНТРОЛЬ</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[10px] font-bold text-blue-700">TELEGRAM</span>
                <span className="text-[10px] text-slate-400 font-mono">ПРОВЕРКА ЧЕЛОВЕКОМ</span>
              </div>
            </div>
         </div>

         <Button 
           onClick={onManualSend}
           disabled={!isReady}
           className={cn(
             "h-12 px-8 font-bold tracking-wide transition-all duration-300 relative overflow-hidden",
             isReady 
               ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5" 
               : "bg-slate-200 text-slate-400"
           )}
         >
           ОТПРАВИТЬ
         </Button>
      </div>

      {/* RIGHT: Auto Mode */}
      <div className="w-1/2 p-6 flex items-center justify-between bg-slate-100/50 relative overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
         <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

         <div className="flex items-center gap-5 pl-8 relative z-10">
            <div className="flex -space-x-3 group-hover:space-x-1 transition-all duration-300">
               <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center border-4 border-white shadow-lg z-30">
                 <Youtube size={16} className="text-white" />
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border-4 border-white shadow-lg z-20">
                 <span className="text-xs font-bold text-white">@</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg z-10">
                 <Globe size={16} className="text-slate-500" />
               </div>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">АВТОПИЛОТ</h4>
              <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-wider uppercase">
                ПОЛНАЯ АВТОМАТИЗАЦИЯ
              </p>
            </div>
         </div>

         <Button 
           onClick={onAutoStart}
           disabled={!isReady}
           className={cn(
             "h-12 px-10 font-bold tracking-wide transition-all duration-300 relative overflow-hidden",
             isReady 
               ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5" 
               : "bg-slate-200 text-slate-400"
           )}
         >
           <Rocket size={18} className={cn("mr-2", isReady && "animate-pulse")} />
           ЗАПУСК
         </Button>
      </div>
    </div>
  );
};
