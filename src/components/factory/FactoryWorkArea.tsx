import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Film, 
  Images, 
  FileText, 
  Play, 
  CheckCircle2, 
  Cpu,
  Sparkles,
  Zap,
  Type,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FactoryWorkAreaProps {
  script: string;
  onScriptChange: (val: string) => void;
  isProcessing: boolean;
  onStartFactory: () => void;
  productionStatus: {
    avatar: number;
    viral: number;
    carousel: number;
    threads: number;
    telegram: number;
    article: number;
  };
}

export const FactoryWorkArea = ({ 
  script, 
  onScriptChange, 
  isProcessing, 
  onStartFactory,
  productionStatus 
}: FactoryWorkAreaProps) => {

  return (
    <div className="flex-1 flex gap-px bg-slate-200 overflow-hidden">
      {/* LEFT: Script Editor */}
      <div className="w-1/2 bg-white p-6 flex flex-col relative border-r border-slate-200">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        
        <div className="flex justify-between items-center mb-6 z-10">
           <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
              <FileText size={18} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Мастер-Сценарий</h3>
              <p className="text-[10px] text-slate-500 font-mono">ИСХОДНЫЙ КОД КОНТЕНТА</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
              <Sparkles size={12} className="mr-2" />
              AI Улучшение
            </Button>
            <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
              {script.length} СИМВ.
            </Badge>
          </div>
        </div>
        
        <div className="flex-1 relative group z-10">
          <Textarea 
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            placeholder="Введите описание контента или вставьте ссылку..."
            className="w-full h-full bg-slate-50 border-slate-200 text-slate-800 resize-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 p-6 font-mono text-sm leading-loose rounded-xl transition-all"
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 font-mono pointer-events-none">
            MARKVISION AI EDITOR V2.0
          </div>
        </div>
      </div>

      {/* RIGHT: Production Highway */}
      <div className="w-1/2 bg-slate-50 p-8 flex flex-col relative overflow-y-auto">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />

        <div className="relative z-10 min-h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg border shadow-sm transition-colors", isProcessing ? "bg-purple-50 border-purple-200" : "bg-white border-slate-200")}>
                <Cpu className={cn("w-5 h-5", isProcessing ? "text-purple-600 animate-spin" : "text-slate-500")} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-widest text-slate-900 uppercase">
                  Производственная Линия
                </h2>
                <div className="flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isProcessing ? "bg-emerald-500" : "bg-slate-300")} />
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {isProcessing ? "СИСТЕМА АКТИВНА" : "ОЖИДАНИЕ ЗАПУСКА"}
                  </span>
                </div>
              </div>
             </div>
          </div>

          {/* THE BUTTON */}
          {!isProcessing && Object.values(productionStatus).every(v => v === 0) && (
             <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[2px] bg-white/30 transition-all duration-500">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartFactory}
                  className="group relative flex flex-col items-center justify-center w-56 h-56 rounded-full bg-white border border-slate-200 hover:border-purple-500 transition-all duration-500 shadow-2xl shadow-slate-200"
                >
                   <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
                   
                   {/* Inner Circle */}
                   <div className="w-40 h-40 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-purple-500 group-hover:animate-[spin_10s_linear_infinite] transition-colors duration-300">
                      <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center shadow-inner">
                        <Play className="w-10 h-10 text-slate-300 fill-current group-hover:text-purple-500 group-hover:fill-purple-500 ml-1 transition-colors duration-300" />
                      </div>
                   </div>
                   
                   <div className="absolute bottom-10 flex flex-col items-center">
                     <span className="text-xs font-bold tracking-[0.2em] text-slate-400 group-hover:text-purple-600 transition-colors">ЗАПУСК</span>
                     <span className="text-[8px] font-mono text-slate-300 mt-1">ИНИЦИАЛИЗАЦИЯ</span>
                   </div>
                </motion.button>
             </div>
          )}

          {/* LINES */}
          <div className="flex-1 flex flex-col justify-start gap-5 pb-20">
            <ProductionLine 
              icon={<Bot />} 
              label="АВАТАР REELS" 
              sublabel="Генерация HeyGen + Submagic" 
              progress={productionStatus.avatar} 
              color="text-blue-600"
              barColor="bg-blue-500"
              borderColor="border-blue-200"
            />
            <ProductionLine 
              icon={<Film />} 
              label="ВИРУСНОЕ ВИДЕО" 
              sublabel="Рендеринг Sora 2.0" 
              progress={productionStatus.viral} 
              color="text-pink-600"
              barColor="bg-pink-500"
              borderColor="border-pink-200"
            />
            <ProductionLine 
              icon={<Images />} 
              label="КАРУСЕЛЬ" 
              sublabel="Сборка 1:1 (7 Слайдов)" 
              progress={productionStatus.carousel} 
              color="text-amber-600"
              barColor="bg-amber-500"
              borderColor="border-amber-200"
            />
            <ProductionLine 
              icon={<Type />} 
              label="THREADS" 
              sublabel="Текстовый тред" 
              progress={productionStatus.threads} 
              color="text-orange-600"
              barColor="bg-orange-500"
              borderColor="border-orange-200"
            />
            <ProductionLine 
              icon={<Send />} 
              label="TELEGRAM" 
              sublabel="Пост для канала" 
              progress={productionStatus.telegram} 
              color="text-sky-600"
              barColor="bg-sky-500"
              borderColor="border-sky-200"
            />
            <ProductionLine 
              icon={<FileText />} 
              label="СТАТЬИ" 
              sublabel="Адаптация Threads + Web" 
              progress={productionStatus.article} 
              color="text-emerald-600"
              barColor="bg-emerald-500"
              borderColor="border-emerald-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductionLine = ({ icon, label, sublabel, progress, color, barColor, borderColor }: any) => {
  const isComplete = progress === 100;
  const isActive = progress > 0 && progress < 100;

  return (
    <div className={cn(
      "relative h-[84px] bg-white rounded-2xl border overflow-hidden group transition-all duration-300 shrink-0",
      isActive ? borderColor : "border-slate-200",
      isComplete ? "shadow-md bg-slate-50/50" : "shadow-sm"
    )}>
       {/* Background Progress */}
       <motion.div 
         className={cn("absolute inset-0 opacity-[0.08]", barColor)} 
         initial={{ width: "0%" }}
         animate={{ width: `${progress}%` }}
         transition={{ type: "spring", stiffness: 50 }}
       />
       
       {/* Active Glow Line */}
       {isActive && (
         <motion.div 
           className={cn("absolute bottom-0 left-0 h-0.5 shadow-[0_0_15px_currentColor]", barColor)}
           initial={{ width: "0%" }}
           animate={{ width: `${progress}%` }}
         />
       )}

       <div className="relative h-full flex items-center px-6 justify-between z-10">
          <div className="flex items-center gap-5">
             <div className={cn(
               "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300",
               isComplete ? "bg-white border-transparent shadow-sm" : "bg-slate-50 border-slate-100",
               isActive && "animate-pulse"
             )}>
               <div className={cn(isComplete || isActive ? color : "text-slate-400")}>
                 {React.cloneElement(icon, { size: 22 })}
               </div>
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h4 className={cn("font-bold tracking-wide text-sm", isComplete ? "text-slate-900" : "text-slate-600")}>{label}</h4>
                 {isActive && <Zap className="w-3 h-3 text-amber-500 fill-amber-500 animate-bounce" />}
               </div>
               <p className="text-[11px] text-slate-400 font-mono mt-1 uppercase tracking-wider">{sublabel}</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 className={cn("h-full rounded-full", barColor)}
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
               />
            </div>
            <div className="w-12 text-right">
               {isComplete ? (
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: "spring", stiffness: 200, damping: 10 }}
                 >
                   <CheckCircle2 size={24} className="text-emerald-500" />
                 </motion.div>
               ) : (
                 <span className="text-xs font-mono font-bold text-slate-400">{Math.round(progress)}%</span>
               )}
            </div>
          </div>
       </div>
    </div>
  );
};
