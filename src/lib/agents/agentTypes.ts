// Agent Type Definitions and Configuration
export type AgentType = 'manager' | 'rop' | 'nps' | 'comments';
export type ToneOfVoice = 'friendly' | 'strict' | 'bold' | 'expert';
export type DeploymentStatus = 'draft' | 'generating' | 'deploying' | 'active' | 'error';

export interface AgentSchedule {
    is24_7: boolean;
    workingHours?: {
        start: string; // HH:mm format
        end: string;
        timezone: string;
    };
}

export interface AgentConfigData {
    // Business context
    business_description: string;

    // Agent tasks (multiselect)
    tasks: string[];

    // Communication style
    tone_of_voice: ToneOfVoice;

    // Restrictions
    stop_topics: string[];

    // Knowledge base
    knowledge_base: {
        office_address?: string;
        phone_number?: string;
        price_list_url?: string;
        additional_info?: string;
    };

    // Schedule
    schedule: AgentSchedule;
}

export interface AgentConfig {
    id: string;
    user_id: string;
    project_id?: string;
    agent_type: AgentType;
    name: string;
    description: string;
    config_data: AgentConfigData;
    system_prompt?: string;
    channels: string[];
    is_active: boolean;
    deployment_status: DeploymentStatus;
    created_at: string;
    updated_at: string;
    last_deployed_at?: string;
}

export interface Question {
    id: string;
    type: 'textarea' | 'multiselect' | 'select' | 'tags' | 'inputs' | 'schedule';
    label: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    fields?: { key: string; label: string; placeholder?: string }[];
}

export interface AgentTypeDefinition {
    type: AgentType;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    color: 'cyan' | 'purple' | 'emerald' | 'orange';
    questions: Question[];
}

// Agent Type Configurations
export const AGENT_TYPES: AgentTypeDefinition[] = [
    {
        type: 'manager',
        name: 'AI Менеджер',
        description: 'Автоматизация продаж и ответов в директ',
        icon: 'MessageSquare',
        color: 'cyan',
        questions: [
            {
                id: 'business_description',
                type: 'textarea',
                label: 'Опишите ваш бизнес',
                description: 'Чем занимаетесь, что продаете?',
                placeholder: 'Например: Мы — стоматологическая клиника в Москве, специализируемся на эстетической стоматологии и имплантации...',
                required: true,
            },
            {
                id: 'tasks',
                type: 'multiselect',
                label: 'Задачи агента',
                description: 'Что он должен делать?',
                required: true,
                options: [
                    { value: 'sell', label: 'Продавать услуги' },
                    { value: 'consult', label: 'Консультировать клиентов' },
                    { value: 'book', label: 'Записывать на прием' },
                    { value: 'qualify', label: 'Квалифицировать лиды' },
                    { value: 'support', label: 'Техподдержка' },
                ],
            },
            {
                id: 'tone_of_voice',
                type: 'select',
                label: 'Tone of Voice',
                description: 'Как общаться с клиентами?',
                required: true,
                options: [
                    { value: 'friendly', label: '😊 Дружелюбно' },
                    { value: 'strict', label: '📋 Строго и официально' },
                    { value: 'bold', label: '🔥 Дерзко и смело' },
                    { value: 'expert', label: '🎓 Как эксперт' },
                ],
            },
            {
                id: 'stop_topics',
                type: 'tags',
                label: 'Стоп-темы',
                description: 'О чем боту нельзя говорить?',
                placeholder: 'Например: конкуренты, скидки выше 10%, личные темы...',
            },
            {
                id: 'knowledge_base',
                type: 'inputs',
                label: 'База знаний',
                description: 'Информация для клиентов',
                fields: [
                    { key: 'office_address', label: 'Адрес офиса', placeholder: 'г. Москва, ул. Ленина, 1' },
                    { key: 'phone_number', label: 'Телефон', placeholder: '+7 (999) 123-45-67' },
                    { key: 'price_list_url', label: 'Ссылка на прайс', placeholder: 'https://...' },
                    { key: 'additional_info', label: 'Доп. информация', placeholder: 'Режим работы, особенности...' },
                ],
            },
            {
                id: 'schedule',
                type: 'schedule',
                label: 'График работы',
                description: 'Когда бот отвечает?',
                required: true,
            },
        ],
    },
    {
        type: 'rop',
        name: 'AI РОП',
        description: 'Анализ транскрипций звонков, выявление ошибок менеджеров',
        icon: 'Phone',
        color: 'purple',
        questions: [
            {
                id: 'business_description',
                type: 'textarea',
                label: 'Опишите ваш бизнес',
                description: 'Какие услуги продаете по телефону?',
                placeholder: 'Например: Продаем услуги стоматологии, основной продукт — имплантация зубов...',
                required: true,
            },
            {
                id: 'tasks',
                type: 'multiselect',
                label: 'Задачи РОПа',
                description: 'Что анализировать?',
                required: true,
                options: [
                    { value: 'script_compliance', label: 'Соблюдение скрипта' },
                    { value: 'objection_handling', label: 'Работа с возражениями' },
                    { value: 'closing', label: 'Закрытие на продажу' },
                    { value: 'tone', label: 'Тон общения' },
                    { value: 'errors', label: 'Критические ошибки' },
                ],
            },
            {
                id: 'tone_of_voice',
                type: 'select',
                label: 'Стиль обратной связи',
                description: 'Как давать фидбек менеджерам?',
                required: true,
                options: [
                    { value: 'friendly', label: '😊 Мягко и поддерживающе' },
                    { value: 'strict', label: '📋 Строго и по делу' },
                    { value: 'expert', label: '🎓 Как наставник' },
                ],
            },
            {
                id: 'stop_topics',
                type: 'tags',
                label: 'Критические ошибки',
                description: 'Что недопустимо в разговоре?',
                placeholder: 'Например: грубость, обещание скидок, неверная информация о ценах...',
            },
            {
                id: 'knowledge_base',
                type: 'inputs',
                label: 'Эталонный скрипт',
                description: 'Как должен выглядеть идеальный звонок?',
                fields: [
                    { key: 'script_url', label: 'Ссылка на скрипт', placeholder: 'https://...' },
                    { key: 'key_phrases', label: 'Ключевые фразы', placeholder: 'Фразы, которые должны быть в звонке' },
                    { key: 'additional_info', label: 'Доп. критерии', placeholder: 'Другие важные моменты...' },
                ],
            },
            {
                id: 'schedule',
                type: 'schedule',
                label: 'График анализа',
                description: 'Когда анализировать звонки?',
                required: true,
            },
        ],
    },
    {
        type: 'nps',
        name: 'Контроль качества (NPS)',
        description: 'Сбор обратной связи, работа с негативом',
        icon: 'Star',
        color: 'emerald',
        questions: [
            {
                id: 'business_description',
                type: 'textarea',
                label: 'Опишите ваш бизнес',
                description: 'Какие услуги оказываете?',
                placeholder: 'Например: Стоматологическая клиника, работаем с 2015 года...',
                required: true,
            },
            {
                id: 'tasks',
                type: 'multiselect',
                label: 'Задачи агента',
                description: 'Что делать с обратной связью?',
                required: true,
                options: [
                    { value: 'collect_feedback', label: 'Собирать отзывы' },
                    { value: 'handle_negative', label: 'Работать с негативом' },
                    { value: 'encourage_positive', label: 'Стимулировать позитивные отзывы' },
                    { value: 'analyze', label: 'Анализировать тренды' },
                ],
            },
            {
                id: 'tone_of_voice',
                type: 'select',
                label: 'Tone of Voice',
                description: 'Как общаться с клиентами?',
                required: true,
                options: [
                    { value: 'friendly', label: '😊 Дружелюбно и заботливо' },
                    { value: 'expert', label: '🎓 Профессионально' },
                ],
            },
            {
                id: 'stop_topics',
                type: 'tags',
                label: 'Стоп-темы',
                description: 'О чем не говорить?',
                placeholder: 'Например: конкуренты, обещания компенсаций без согласования...',
            },
            {
                id: 'knowledge_base',
                type: 'inputs',
                label: 'Информация для работы',
                description: 'Контакты и ссылки',
                fields: [
                    { key: 'review_platforms', label: 'Платформы отзывов', placeholder: 'Google, Яндекс, 2GIS...' },
                    { key: 'contact_email', label: 'Email для жалоб', placeholder: 'support@...' },
                    { key: 'additional_info', label: 'Доп. информация', placeholder: 'Политика компенсаций и т.д.' },
                ],
            },
            {
                id: 'schedule',
                type: 'schedule',
                label: 'График работы',
                description: 'Когда собирать отзывы?',
                required: true,
            },
        ],
    },
    {
        type: 'comments',
        name: 'Ответы на комментарии',
        description: 'Умный парсинг комментов в соцсетях и ответы на них',
        icon: 'MessageCircle',
        color: 'orange',
        questions: [
            {
                id: 'business_description',
                type: 'textarea',
                label: 'Опишите ваш бизнес',
                description: 'Что публикуете в соцсетях?',
                placeholder: 'Например: Публикуем кейсы по имплантации, советы по уходу за зубами...',
                required: true,
            },
            {
                id: 'tasks',
                type: 'multiselect',
                label: 'Задачи агента',
                description: 'Что делать с комментариями?',
                required: true,
                options: [
                    { value: 'answer_questions', label: 'Отвечать на вопросы' },
                    { value: 'engage', label: 'Вовлекать аудиторию' },
                    { value: 'moderate', label: 'Модерировать негатив' },
                    { value: 'convert', label: 'Конвертировать в лиды' },
                ],
            },
            {
                id: 'tone_of_voice',
                type: 'select',
                label: 'Tone of Voice',
                description: 'Как общаться в комментариях?',
                required: true,
                options: [
                    { value: 'friendly', label: '😊 Дружелюбно' },
                    { value: 'bold', label: '🔥 Дерзко' },
                    { value: 'expert', label: '🎓 Как эксперт' },
                ],
            },
            {
                id: 'stop_topics',
                type: 'tags',
                label: 'Стоп-темы',
                description: 'На что не отвечать?',
                placeholder: 'Например: политика, религия, конкуренты...',
            },
            {
                id: 'knowledge_base',
                type: 'inputs',
                label: 'База знаний',
                description: 'Информация для ответов',
                fields: [
                    { key: 'faq_url', label: 'Ссылка на FAQ', placeholder: 'https://...' },
                    { key: 'contact_info', label: 'Контакты для связи', placeholder: 'Телефон, email...' },
                    { key: 'additional_info', label: 'Доп. информация', placeholder: 'Акции, специальные предложения...' },
                ],
            },
            {
                id: 'schedule',
                type: 'schedule',
                label: 'График работы',
                description: 'Когда отвечать на комментарии?',
                required: true,
            },
        ],
    },
];

// Helper function to get agent type by type string
export const getAgentType = (type: AgentType): AgentTypeDefinition | undefined => {
    return AGENT_TYPES.find(at => at.type === type);
};

// Helper to get icon color classes
export const getAgentColorClasses = (color: AgentTypeDefinition['color']) => {
    const colorMap = {
        cyan: {
            border: 'border-cyan-500',
            bg: 'bg-cyan-500/10',
            text: 'text-cyan-400',
            glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
            hoverGlow: 'hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]',
        },
        purple: {
            border: 'border-purple-500',
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
            hoverGlow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]',
        },
        emerald: {
            border: 'border-emerald-500',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
            hoverGlow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]',
        },
        orange: {
            border: 'border-orange-500',
            bg: 'bg-orange-500/10',
            text: 'text-orange-400',
            glow: 'shadow-[0_0_30px_rgba(251,146,60,0.3)]',
            hoverGlow: 'hover:shadow-[0_0_40px_rgba(251,146,60,0.4)]',
        },
    };

    return colorMap[color];
};
