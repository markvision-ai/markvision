import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { AGENT_TYPES, AgentType } from '@/lib/agents/agentTypes';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AgentStatus {
    type: AgentType;
    isConfigured: boolean;
    isActive: boolean;
    agentId?: string;
}

export const AgentRoster: React.FC = () => {
    const navigate = useNavigate();
    const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentStatuses();
    }, []);

    const fetchAgentStatuses = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: agents, error } = await supabase
                .from('ai_agents')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching agents:', error);
                return;
            }

            // Map all agent types to their status
            const statuses: AgentStatus[] = AGENT_TYPES.map(agentType => {
                const existingAgent = agents?.find(a => a.agent_type === agentType.type);
                return {
                    type: agentType.type,
                    isConfigured: !!existingAgent,
                    isActive: existingAgent?.is_active || false,
                    agentId: existingAgent?.id,
                };
            });

            setAgentStatuses(statuses);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigure = (agentType: AgentType) => {
        navigate(`/agents/setup/${agentType}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                    <p className="text-white/40 text-sm">Загрузка агентов...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-widest"
                >
                    <Sparkles className="w-4 h-4" />
                    AI Intelligence Hub
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                >
                    Ваши <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">AI Агенты</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-white/50 font-light max-w-2xl mx-auto"
                >
                    Настройте умных помощников для автоматизации продаж, контроля качества и работы с клиентами
                </motion.p>
            </div>

            {/* Stats Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
            >
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center aspect-square flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-cyan-400">
                        {agentStatuses.filter(a => a.isActive).length}
                    </div>
                    <div className="text-sm text-white/40 uppercase tracking-widest font-bold mt-1">
                        Активных
                    </div>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center aspect-square flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-purple-400">
                        {agentStatuses.filter(a => a.isConfigured).length}
                    </div>
                    <div className="text-sm text-white/40 uppercase tracking-widest font-bold mt-1">
                        Настроено
                    </div>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center aspect-square flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-white/60">
                        {AGENT_TYPES.length}
                    </div>
                    <div className="text-sm text-white/40 uppercase tracking-widest font-bold mt-1">
                        Доступно
                    </div>
                </div>
            </motion.div>

            {/* Agent Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {AGENT_TYPES.map((agentType, index) => {
                    const status = agentStatuses.find(s => s.type === agentType.type);
                    return (
                        <motion.div
                            key={agentType.type}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                        >
                            <AgentCard
                                agentType={agentType}
                                isActive={status?.isActive || false}
                                isConfigured={status?.isConfigured || false}
                                onConfigure={() => handleConfigure(agentType.type)}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};
