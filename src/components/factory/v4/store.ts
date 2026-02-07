import { create } from 'zustand';

export type Idea = {
  id: string;
  title: string;
  source: string;
  views: string;
  viralScore: number;
};

export type ScriptStatus = 'pending' | 'writing' | 'ready';

export type Script = {
  id: string;
  title: string;
  status: ScriptStatus;
  content?: string;
};

export type ContentType = 'avatar_video' | 'viral_video' | 'carousel' | 'threads' | 'seo_blog' | 'tg_post';

export type ProductionItem = {
  type: ContentType;
  status: 'idle' | 'generating' | 'ready' | 'error';
  content?: any; // Preview data
  progress?: number;
  startedAt?: number;
  durationMs?: number;
};

export type PostingStatus = 'pending' | 'sending' | 'published' | 'error';

export type PostingItem = {
  id: string;
  channel: string; // 'TikTok', 'YouTube Shorts', 'Telegram', etc.
  status: PostingStatus;
  link?: string;
  error?: string;
};

interface FactoryState {
  ideas: Idea[];
  scripts: Script[];
  activeScriptId: string | null;
  productionLines: Record<ContentType, ProductionItem>;
  postingQueue: PostingItem[];
  webhookUrl?: string | null;

  // Actions
  setIdeas: (ideas: Idea[]) => void;
  moveIdeaToWorkshop: (idea: Idea) => void;
  updateScriptStatus: (id: string, status: ScriptStatus) => void;
  setActiveScript: (id: string) => void;
  startProduction: (type: ContentType) => void;
  startAllProductions: () => void;
  updateProductionItem: (type: ContentType, updates: Partial<ProductionItem>) => void;
  approveAllToPosting: () => void;
  updatePostingStatus: (id: string, status: PostingStatus) => void;
  setWebhookUrl: (url: string | null) => void;
  applyWebhookUpdate: (update: { id?: string; channel?: string; status: PostingStatus }) => void;
}

export const useFactoryStore = create<FactoryState>((set, get) => ({
  ideas: [
    { id: '1', title: 'Мифы об имплантации: больно ли?', source: 'Dr. Smile', views: '150K', viralScore: 95 },
    { id: '2', title: 'Straumann vs Osstem: Битва титанов', source: 'StomGuide', views: '89K', viralScore: 88 },
    { id: '3', title: 'Зубы за 1 день: Реальность?', source: 'ImplantPro', views: '210K', viralScore: 98 },
    { id: '4', title: 'Осложнения: Как избежать?', source: 'SafetyDent', views: '120K', viralScore: 85 },
    { id: '5', title: 'Цена улыбки: Из чего складывается?', source: 'MarketWatch', views: '180K', viralScore: 92 },
    { id: '6', title: 'Виниры vs Люминиры: В чем разница?', source: 'AestheticDaily', views: '145K', viralScore: 90 },
    { id: '7', title: 'Отбеливание Zoom 4: Вредно или нет?', source: 'WhiteSmile', views: '110K', viralScore: 87 },
    { id: '8', title: 'Брекеты или Элайнеры: Что выбрать?', source: 'OrthoWorld', views: '200K', viralScore: 96 },
    { id: '9', title: 'Лечение каналов под микроскопом', source: 'EndoExpert', views: '95K', viralScore: 82 },
    { id: '10', title: 'Детская стоматология без слез', source: 'KidsDent', views: '130K', viralScore: 89 },
  ],
  scripts: [],
  activeScriptId: null,
  productionLines: {
    avatar_video: { type: 'avatar_video', status: 'idle', progress: 0 },
    viral_video: { type: 'viral_video', status: 'idle', progress: 0 },
    carousel: { type: 'carousel', status: 'idle', progress: 0 },
    threads: { type: 'threads', status: 'idle', progress: 0 },
    seo_blog: { type: 'seo_blog', status: 'idle', progress: 0 },
    tg_post: { type: 'tg_post', status: 'idle', progress: 0 },
  },
  postingQueue: [],
  webhookUrl: null,

  setIdeas: (ideas) => set({ ideas }),
  setWebhookUrl: (url) => set({ webhookUrl: url }),

  moveIdeaToWorkshop: (idea) => {
    const newScript: Script = {
      id: crypto.randomUUID(),
      title: idea.title,
      status: 'pending',
    };
    
    set((state) => ({
      ideas: state.ideas.filter((i) => i.id !== idea.id),
      scripts: [...state.scripts, newScript],
    }));

    // Simulate AI Writing
    setTimeout(() => {
      get().updateScriptStatus(newScript.id, 'writing');
      setTimeout(() => {
        get().updateScriptStatus(newScript.id, 'ready');
      }, 2000);
    }, 500);
  },

  updateScriptStatus: (id, status) =>
    set((state) => ({
      scripts: state.scripts.map((s) => (s.id === id ? { ...s, status } : s)),
    })),

  setActiveScript: (id) => set((state) => ({ 
    activeScriptId: id,
    // Reset production lines when switching script
    productionLines: {
      avatar_video: { type: 'avatar_video', status: 'idle', progress: 0 },
      viral_video: { type: 'viral_video', status: 'idle', progress: 0 },
      carousel: { type: 'carousel', status: 'idle', progress: 0 },
      threads: { type: 'threads', status: 'idle', progress: 0 },
      seo_blog: { type: 'seo_blog', status: 'idle', progress: 0 },
      tg_post: { type: 'tg_post', status: 'idle', progress: 0 },
    }
  })),

  startProduction: (type) => {
    const durationMs = 3000;
    const startedAt = Date.now();
    set((state) => ({
      productionLines: {
        ...state.productionLines,
        [type]: { 
          ...state.productionLines[type], 
          status: 'generating',
          startedAt,
          durationMs,
          progress: 0
        },
      },
    }));

    const stepMs = 200;
    const steps = Math.ceil(durationMs / stepMs);
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        set((state) => {
          const line = state.productionLines[type];
          if (!line || line.status !== 'generating') return state;
          const elapsed = Date.now() - (line.startedAt || startedAt);
          const pct = Math.min(99, Math.floor((elapsed / (line.durationMs || durationMs)) * 100));
          return {
            productionLines: {
              ...state.productionLines,
              [type]: { ...line, progress: pct },
            },
          };
        });
      }, i * stepMs);
    }

    setTimeout(() => {
      set((state) => ({
        productionLines: {
          ...state.productionLines,
          [type]: { 
            ...state.productionLines[type], 
            status: 'ready',
            progress: 100 
          },
        },
      }));
    }, durationMs);
  },

  startAllProductions: () => {
    const types: ContentType[] = ['avatar_video', 'viral_video', 'carousel', 'threads', 'seo_blog', 'tg_post'];
    
    // Set all to generating
    set((state) => {
      const newLines = { ...state.productionLines };
      types.forEach(type => {
        const startedAt = Date.now();
        // default durations, will override below
        newLines[type] = { ...newLines[type], status: 'generating', startedAt, durationMs: 3000, progress: 0 };
      });
      return { productionLines: newLines };
    });

    // Simulate different generation times
    const delays = {
      tg_post: 2000,
      threads: 2500,
      seo_blog: 3000,
      carousel: 4000,
      viral_video: 5000,
      avatar_video: 6000
    };

    types.forEach(type => {
      const durationMs = delays[type];
      const stepMs = 200;
      const steps = Math.ceil(durationMs / stepMs);
      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          set((state) => {
            const line = state.productionLines[type];
            if (!line || line.status !== 'generating') return state;
            const elapsed = Date.now() - (line.startedAt || Date.now());
            const pct = Math.min(99, Math.floor((elapsed / (durationMs)) * 100));
            return {
              productionLines: {
                ...state.productionLines,
                [type]: { ...line, durationMs, progress: pct },
              },
            };
          });
        }, i * stepMs);
      }
      setTimeout(() => {
        set((state) => ({
          productionLines: {
            ...state.productionLines,
            [type]: { ...state.productionLines[type], status: 'ready', durationMs, progress: 100 },
          },
        }));
      }, durationMs);
    });
  },

  updateProductionItem: (type, updates) =>
    set((state) => ({
      productionLines: {
        ...state.productionLines,
        [type]: { ...state.productionLines[type], ...updates },
      },
    })),

  approveAllToPosting: () => {
    const newPostingItems: PostingItem[] = [
      { id: crypto.randomUUID(), channel: 'TikTok', status: 'pending' },
      { id: crypto.randomUUID(), channel: 'YouTube Shorts', status: 'pending' },
      { id: crypto.randomUUID(), channel: 'Telegram Channel', status: 'pending' },
      { id: crypto.randomUUID(), channel: 'Threads', status: 'pending' },
      { id: crypto.randomUUID(), channel: 'Website Blog', status: 'pending' },
    ];

    set((state) => ({
      postingQueue: [...state.postingQueue, ...newPostingItems],
    }));

    const url = get().webhookUrl;
    if (url) {
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: newPostingItems })
        }).catch(() => {});
      } catch (e) { void e; }
    }
    
    newPostingItems.forEach((item, index) => {
      setTimeout(() => {
        get().updatePostingStatus(item.id, 'sending');
        setTimeout(() => {
          get().updatePostingStatus(item.id, Math.random() > 0.1 ? 'published' : 'error');
        }, 1500);
      }, index * 1000);
    });
  },

  updatePostingStatus: (id, status) =>
    set((state) => ({
      postingQueue: state.postingQueue.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),
  
  applyWebhookUpdate: (update) =>
    set((state) => ({
      postingQueue: state.postingQueue.map((item) => {
        const matchById = update?.id && item.id === update.id;
        const matchByChannel = !update?.id && update?.channel && item.channel === update.channel;
        if (matchById || matchByChannel) {
          return { ...item, status: update.status };
        }
        return item;
      }),
    })),
}));
