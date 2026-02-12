import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CallAnalytic {
    id: string;
    project_id: string;
    manager_id: string;
    manager_name: string;
    call_type: 'incoming' | 'outgoing' | 'missed';
    duration: number; // in seconds
    call_date: string;
    audio_url?: string;
    transcript?: {
        speaker: string;
        text: string;
        timestamp: number;
    }[];
    ai_score: number; // 0-100
    scores?: {
        greeting: number;
        knowledge: number;
        objections: number;
        closing: number;
        professionalism: number;
    };
    sentiment_data?: {
        positive: number;
        neutral: number;
        negative: number;
    };
    key_moments?: {
        timestamp: number;
        type: string;
        description: string;
    }[];
    recommendations?: string[];
    created_at: string;
}

export interface CallAnalyticsStats {
    totalCalls: number;
    incomingCalls: number;
    outgoingCalls: number;
    missedCalls: number;
    avgDuration: number;
    avgScore: number;
    conversionRate: number;
}

export function useCallAnalytics(projectId: string | null) {
    const [calls, setCalls] = useState<CallAnalytic[]>([]);
    const [stats, setStats] = useState<CallAnalyticsStats>({
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        avgDuration: 0,
        avgScore: 0,
        conversionRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        dateFrom: null as Date | null,
        dateTo: null as Date | null,
        managerId: null as string | null,
        callType: null as 'incoming' | 'outgoing' | 'missed' | null,
        minScore: 0,
        maxScore: 100,
    });

    const fetchCalls = useCallback(async () => {
        if (!projectId) {
            // Use mock data for demonstration
            const mockCalls: CallAnalytic[] = [
                {
                    id: '1',
                    project_id: projectId || 'demo',
                    manager_id: 'm1',
                    manager_name: 'Анна Иванова',
                    call_type: 'incoming',
                    duration: 420,
                    call_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    ai_score: 85,
                    scores: {
                        greeting: 90,
                        knowledge: 85,
                        objections: 80,
                        closing: 85,
                        professionalism: 88,
                    },
                    sentiment_data: {
                        positive: 70,
                        neutral: 25,
                        negative: 5,
                    },
                    recommendations: [
                        'Отличное приветствие и установление контакта',
                        'Рекомендуется улучшить технику закрытия сделки',
                        'Хорошее знание продукта'
                    ],
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    project_id: projectId || 'demo',
                    manager_id: 'm2',
                    manager_name: 'Дмитрий Петров',
                    call_type: 'outgoing',
                    duration: 180,
                    call_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    ai_score: 62,
                    scores: {
                        greeting: 70,
                        knowledge: 60,
                        objections: 55,
                        closing: 65,
                        professionalism: 60,
                    },
                    sentiment_data: {
                        positive: 40,
                        neutral: 45,
                        negative: 15,
                    },
                    recommendations: [
                        'Необходимо улучшить знание продукта',
                        'Работа с возражениями требует доработки',
                        'Слишком быстрое завершение разговора'
                    ],
                    created_at: new Date().toISOString(),
                },
                {
                    id: '3',
                    project_id: projectId || 'demo',
                    manager_id: 'm1',
                    manager_name: 'Анна Иванова',
                    call_type: 'outgoing',
                    duration: 540,
                    call_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    ai_score: 92,
                    scores: {
                        greeting: 95,
                        knowledge: 90,
                        objections: 92,
                        closing: 90,
                        professionalism: 93,
                    },
                    sentiment_data: {
                        positive: 85,
                        neutral: 12,
                        negative: 3,
                    },
                    recommendations: [
                        'Отличная работа! Эталонный звонок',
                        'Прекрасное владение техниками продаж',
                        'Высокий уровень профессионализма'
                    ],
                    created_at: new Date().toISOString(),
                },
                {
                    id: '4',
                    project_id: projectId || 'demo',
                    manager_id: 'm3',
                    manager_name: 'Елена Смирнова',
                    call_type: 'missed',
                    duration: 0,
                    call_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    ai_score: 0,
                    created_at: new Date().toISOString(),
                },
                {
                    id: '5',
                    project_id: projectId || 'demo',
                    manager_id: 'm2',
                    manager_name: 'Дмитрий Петров',
                    call_type: 'incoming',
                    duration: 300,
                    call_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                    ai_score: 75,
                    scores: {
                        greeting: 80,
                        knowledge: 75,
                        objections: 70,
                        closing: 75,
                        professionalism: 75,
                    },
                    sentiment_data: {
                        positive: 60,
                        neutral: 30,
                        negative: 10,
                    },
                    recommendations: [
                        'Хорошая работа в целом',
                        'Можно улучшить работу с возражениями',
                        'Профессиональный тон общения'
                    ],
                    created_at: new Date().toISOString(),
                },
            ];

            setCalls(mockCalls);

            // Calculate stats
            const totalCalls = mockCalls.length;
            const incomingCalls = mockCalls.filter(c => c.call_type === 'incoming').length;
            const outgoingCalls = mockCalls.filter(c => c.call_type === 'outgoing').length;
            const missedCalls = mockCalls.filter(c => c.call_type === 'missed').length;
            const avgDuration = mockCalls.reduce((sum, c) => sum + c.duration, 0) / totalCalls;
            const avgScore = mockCalls.filter(c => c.ai_score > 0).reduce((sum, c) => sum + c.ai_score, 0) / mockCalls.filter(c => c.ai_score > 0).length;
            const conversionRate = 65; // Mock conversion rate

            setStats({
                totalCalls,
                incomingCalls,
                outgoingCalls,
                missedCalls,
                avgDuration,
                avgScore,
                conversionRate,
            });

            setLoading(false);
            return;
        }

        try {
            // TODO: Replace with real Supabase query when table is created
            const { data, error } = await supabase
                .from('call_analytics')
                .select('*')
                .eq('project_id', projectId)
                .order('call_date', { ascending: false })
                .limit(100);

            if (error) throw error;

            setCalls(data || []);

            // Calculate stats from real data
            // ... (similar to mock data calculation)

        } catch (error) {
            console.error('Error fetching call analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]); // Removed filters from dependencies as they are not used yet

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    const applyFilters = useCallback((newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchCalls();
    }, [fetchCalls]);

    return {
        calls,
        stats,
        loading,
        filters,
        applyFilters,
        refresh,
    };
}
