import * as React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Send, Globe, MessageCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelSelectorProps {
    selectedChannels: string[];
    onChannelsChange: (channels: string[]) => void;
}

const channels = [
    {
        id: 'instagram',
        name: 'Instagram Direct',
        icon: Instagram,
        color: 'from-fuchsia-600 to-pink-600',
        description: 'Автоответы в директ',
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: Send,
        color: 'from-cyan-600 to-blue-600',
        description: 'Бот или юзербот',
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: MessageCircle,
        color: 'from-blue-600 to-green-600',
        description: 'Green-API интеграция',
    },
    {
        id: 'website',
        name: 'Website Widget',
        icon: Globe,
        color: 'from-purple-600 to-indigo-600',
        description: 'Чат на сайте',
    },
];

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({
    selectedChannels,
    onChannelsChange,
}) => {
    const toggleChannel = (channelId: string) => {
        if (selectedChannels.includes(channelId)) {
            onChannelsChange(selectedChannels.filter((id) => id !== channelId));
        } else {
            onChannelsChange([...selectedChannels, channelId]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Выберите каналы</h2>
                <p className="text-white/50">Где будет работать ваш агент?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels.map((channel, index) => {
                    const isSelected = selectedChannels.includes(channel.id);
                    const Icon = channel.icon;

                    return (
                        <motion.div
                            key={channel.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => toggleChannel(channel.id)}
                            className={cn(
                                'relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300',
                                'bg-white/[0.02] backdrop-blur-xl',
                                isSelected
                                    ? 'border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                                    : 'border-white/5 hover:border-white/20'
                            )}
                        >
                            {/* Gradient background on hover */}
                            <div
                                className={cn(
                                    'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300',
                                    `bg-gradient-to-br ${channel.color}`,
                                    isSelected ? 'opacity-10' : 'group-hover:opacity-5'
                                )}
                            />

                            {/* Content */}
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div
                                        className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                                            isSelected
                                                ? `bg-gradient-to-br ${channel.color}`
                                                : 'bg-white/5'
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'w-6 h-6 transition-colors',
                                                isSelected ? 'text-white' : 'text-white/40'
                                            )}
                                        />
                                    </div>

                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"
                                        >
                                            <Check className="w-4 h-4 text-black" />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3
                                        className={cn(
                                            'text-lg font-bold transition-colors',
                                            isSelected ? 'text-white' : 'text-white/60'
                                        )}
                                    >
                                        {channel.name}
                                    </h3>
                                    <p className="text-sm text-white/40">{channel.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {selectedChannels.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl"
                >
                    <p className="text-sm text-cyan-400">
                        <span className="font-bold">Выбрано каналов: {selectedChannels.length}</span>
                        {' — '}
                        {channels
                            .filter((c) => selectedChannels.includes(c.id))
                            .map((c) => c.name)
                            .join(', ')}
                    </p>
                </motion.div>
            )}
        </div>
    );
};
