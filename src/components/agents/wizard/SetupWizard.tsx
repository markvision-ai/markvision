import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
    AGENT_TYPES,
    AgentType,
    getAgentType,
    AgentConfigData,
} from '@/lib/agents/agentTypes';
import { QuestionRenderer } from './QuestionRenderer';
import { ChannelSelector } from './ChannelSelector';
import { PromptPreview } from './PromptPreview';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

type WizardStep = 'questions' | 'channels' | 'preview' | 'deploying';

export const SetupWizard: React.FC = () => {
    const { agentType } = useParams<{ agentType: AgentType }>();
    const navigate = useNavigate();

    const agentConfig = agentType ? getAgentType(agentType) : null;

    const [step, setStep] = useState<WizardStep>('questions');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    useEffect(() => {
        if (!agentConfig) {
            toast.error('Неизвестный тип агента');
            navigate('/agents');
        }
    }, [agentConfig, navigate]);

    if (!agentConfig) return null;

    const totalQuestions = agentConfig.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        const currentQuestion = agentConfig.questions[currentQuestionIndex];

        // Validate required fields
        if (currentQuestion.required && !answers[currentQuestion.id]) {
            toast.error('Пожалуйста, заполните обязательное поле');
            return;
        }

        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Move to channel selection
            setStep('channels');
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (step === 'channels') {
            setStep('questions');
            setCurrentQuestionIndex(totalQuestions - 1);
        } else if (step === 'preview') {
            setStep('channels');
        }
    };

    const handleGeneratePrompt = async () => {
        if (selectedChannels.length === 0) {
            toast.error('Выберите хотя бы один канал');
            return;
        }

        setIsGenerating(true);
        setStep('preview');

        try {
            // Simulate API call to generate prompt
            // In production, this would call your n8n webhook
            await new Promise(resolve => setTimeout(resolve, 2000));

            const prompt = `Вы — ${agentConfig.name} для бизнеса: "${answers.business_description}".

Ваши задачи: ${answers.tasks?.join(', ')}.

Стиль общения: ${answers.tone_of_voice}.

Стоп-темы (не обсуждать): ${answers.stop_topics?.join(', ')}.

База знаний:
${Object.entries(answers.knowledge_base || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

График работы: ${answers.schedule?.is24_7 ? '24/7' : `${answers.schedule?.workingHours?.start} - ${answers.schedule?.workingHours?.end}`}

Каналы: ${selectedChannels.join(', ')}`;

            setGeneratedPrompt(prompt);
        } catch (error) {
            console.error('Error generating prompt:', error);
            toast.error('Ошибка при генерации промпта');
            setStep('channels');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeploy = async () => {
        setIsDeploying(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Build config data
            const configData: Partial<AgentConfigData> = {
                business_description: answers.business_description,
                tasks: answers.tasks,
                tone_of_voice: answers.tone_of_voice,
                stop_topics: answers.stop_topics,
                knowledge_base: answers.knowledge_base,
                schedule: answers.schedule,
            };

            // Save to database
            const { data, error } = await supabase
                .from('ai_agents')
                .upsert({
                    user_id: user.id,
                    agent_type: agentConfig.type,
                    name: agentConfig.name,
                    description: agentConfig.description,
                    config_data: configData,
                    system_prompt: generatedPrompt,
                    channels: selectedChannels,
                    is_active: true,
                    deployment_status: 'active',
                    last_deployed_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Агент успешно развернут!', {
                icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
            });

            // Navigate back to agents page
            setTimeout(() => {
                navigate('/agents');
            }, 1500);
        } catch (error) {
            console.error('Error deploying agent:', error);
            toast.error('Ошибка при развертывании агента');
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/agents')}
                        className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Назад к агентам
                    </Button>

                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" />
                            Настройка агента
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                            {agentConfig.name}
                        </h1>
                        <p className="text-white/50">{agentConfig.description}</p>
                    </div>

                    {/* Progress Bar */}
                    {step === 'questions' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">
                                    Вопрос {currentQuestionIndex + 1} из {totalQuestions}
                                </span>
                                <span className="text-cyan-400 font-bold">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {step === 'questions' && (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <QuestionRenderer
                                question={agentConfig.questions[currentQuestionIndex]}
                                value={answers[agentConfig.questions[currentQuestionIndex].id]}
                                onChange={(value) =>
                                    handleAnswerChange(agentConfig.questions[currentQuestionIndex].id, value)
                                }
                            />

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={currentQuestionIndex === 0}
                                    className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Назад
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                                >
                                    {currentQuestionIndex === totalQuestions - 1 ? 'Далее' : 'Продолжить'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'channels' && (
                        <motion.div
                            key="channels"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <ChannelSelector
                                selectedChannels={selectedChannels}
                                onChannelsChange={setSelectedChannels}
                            />

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Назад
                                </Button>
                                <Button
                                    onClick={handleGeneratePrompt}
                                    disabled={selectedChannels.length === 0}
                                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                                >
                                    Сгенерировать промпт
                                    <Sparkles className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'preview' && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                                    <p className="text-white/60 text-lg">Генерация нейронных связей...</p>
                                </div>
                            ) : (
                                <>
                                    <PromptPreview prompt={generatedPrompt} />

                                    <div className="flex justify-between pt-6">
                                        <Button
                                            variant="ghost"
                                            onClick={handleBack}
                                            className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Назад
                                        </Button>
                                        <Button
                                            onClick={handleDeploy}
                                            disabled={isDeploying}
                                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                        >
                                            {isDeploying ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Развертывание...
                                                </>
                                            ) : (
                                                <>
                                                    Развернуть агента
                                                    <CheckCircle2 className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
