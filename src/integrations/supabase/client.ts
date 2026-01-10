export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 1, // Минимальная нагрузка
    },
    // Увеличиваем интервал проверки связи, чтобы не спамить
    timeout: 60000, 
  },
  global: {
    // Настройка задержки между попытками (в миллисекундах)
    fetch: (url, options) => {
      return fetch(url, options);
    },
  },
});

// Настройка канала с ручным управлением повторами
const channel = supabase.channel('leads-channel', {
  config: {
    broadcast: { self: false },
    presence: { key: 'crm' },
  }
});

// Если соединение закрыто, ждем 30 секунд перед следующей попыткой
channel.subscribe((status) => {
  if (status === 'CLOSED') {
    console.log('⚠️ Реальное время: связь закрыта. Ждем 30 сек...');
    setTimeout(() => {
      channel.subscribe();
    }, 30000); 
  }
});
