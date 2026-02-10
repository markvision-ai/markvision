import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromptPreviewProps {
    prompt: string;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({ prompt }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        toast.success('Промпт скопирован в буфер обмена');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" />
                    Промпт готов
                </div>
                <h2 className="text-3xl font-black text-white">Системная инструкция</h2>
                <p className="text-white/50">
                    Ваш агент теперь знает, как общаться с клиентами
                </p>
            </div>

            {/* Prompt Display */}
            <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-8 space-y-4">
                {/* Animated glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-green-600 opacity-20 blur-xl rounded-2xl animate-pulse" />

                {/* Content */}
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-white/40">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Системный промпт
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className={cn(
                                'text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all',
                                copied && 'text-emerald-400'
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Скопировано
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Копировать
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="bg-[#050505]/80 rounded-xl p-6 border border-white/5">
                        <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
                            {prompt}
                        </pre>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/30">
                        <Sparkles className="w-3 h-3" />
                        Сгенерировано Claude 3.5 Sonnet
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <p className="text-sm text-cyan-400">
                    <span className="font-bold">Что дальше?</span> После развертывания агент будет использовать эту инструкцию для общения с клиентами. Вы сможете отредактировать промпт в любое время.
                </p>
            </div>
        </motion.div>
    );
};
