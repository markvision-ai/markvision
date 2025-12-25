// Attribution Models Logic

export type AttributionModel = 
  | 'first_click'
  | 'last_click'
  | 'last_paid_click'
  | 'linear'
  | 'u_shape'
  | 'time_decay'
  | 'time_growth'
  | 'custom';

export interface Touchpoint {
  id: string;
  position: number;
  totalInChain: number;
  isFirst: boolean;
  isLast: boolean;
  sourceType: string;
  channelName: string;
  campaignName?: string;
  keyword?: string;
  touchedAt: Date;
  dealRevenue: number;
  dealProfit: number;
}

export interface AttributionWeight {
  touchpointId: string;
  weight: number;
  attributedRevenue: number;
  attributedProfit: number;
}

export interface CustomModelSettings {
  firstTouchWeight: number;
  lastTouchWeight: number;
  middleTouchesWeight: number;
}

const PAID_SOURCE_TYPES = ['paid_search', 'paid_social', 'retargeting', 'display', 'video', 'affiliate'];

/**
 * Calculate attribution weights for a chain of touchpoints
 */
export function calculateAttribution(
  touchpoints: Touchpoint[],
  model: AttributionModel,
  customSettings?: CustomModelSettings
): AttributionWeight[] {
  if (touchpoints.length === 0) return [];
  
  const sorted = [...touchpoints].sort((a, b) => a.position - b.position);
  const totalRevenue = sorted[0]?.dealRevenue || 0;
  const totalProfit = sorted[0]?.dealProfit || 0;
  
  let weights: number[] = [];
  
  switch (model) {
    case 'first_click':
      weights = firstClickModel(sorted.length);
      break;
    case 'last_click':
      weights = lastClickModel(sorted.length);
      break;
    case 'last_paid_click':
      weights = lastPaidClickModel(sorted);
      break;
    case 'linear':
      weights = linearModel(sorted.length);
      break;
    case 'u_shape':
      weights = uShapeModel(sorted.length);
      break;
    case 'time_decay':
      weights = timeDecayModel(sorted.length);
      break;
    case 'time_growth':
      weights = timeGrowthModel(sorted.length);
      break;
    case 'custom':
      weights = customModel(sorted.length, customSettings);
      break;
    default:
      weights = lastClickModel(sorted.length);
  }
  
  return sorted.map((tp, index) => ({
    touchpointId: tp.id,
    weight: weights[index],
    attributedRevenue: totalRevenue * weights[index],
    attributedProfit: totalProfit * weights[index],
  }));
}

/**
 * First Click Model: 100% to first touchpoint
 */
function firstClickModel(count: number): number[] {
  if (count === 0) return [];
  const weights = new Array(count).fill(0);
  weights[0] = 1;
  return weights;
}

/**
 * Last Click Model: 100% to last touchpoint
 */
function lastClickModel(count: number): number[] {
  if (count === 0) return [];
  const weights = new Array(count).fill(0);
  weights[count - 1] = 1;
  return weights;
}

/**
 * Last Paid Click Model: 100% to last paid source
 */
function lastPaidClickModel(touchpoints: Touchpoint[]): number[] {
  const count = touchpoints.length;
  if (count === 0) return [];
  
  const weights = new Array(count).fill(0);
  
  // Find last paid touchpoint
  let lastPaidIndex = -1;
  for (let i = count - 1; i >= 0; i--) {
    if (PAID_SOURCE_TYPES.includes(touchpoints[i].sourceType)) {
      lastPaidIndex = i;
      break;
    }
  }
  
  // If no paid touchpoint, use last click
  if (lastPaidIndex === -1) {
    weights[count - 1] = 1;
  } else {
    weights[lastPaidIndex] = 1;
  }
  
  return weights;
}

/**
 * Linear Model: Equal distribution
 */
function linearModel(count: number): number[] {
  if (count === 0) return [];
  const weight = 1 / count;
  return new Array(count).fill(weight);
}

/**
 * U-Shape Model: 40% first, 40% last, 20% distributed among middle
 */
function uShapeModel(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [0.5, 0.5];
  
  const weights = new Array(count).fill(0);
  weights[0] = 0.4;
  weights[count - 1] = 0.4;
  
  const middleWeight = 0.2 / (count - 2);
  for (let i = 1; i < count - 1; i++) {
    weights[i] = middleWeight;
  }
  
  return weights;
}

/**
 * Time Decay Model: Weight increases towards conversion
 */
function timeDecayModel(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [1];
  
  // Exponential growth: weight = 2^position
  const rawWeights: number[] = [];
  for (let i = 0; i < count; i++) {
    rawWeights.push(Math.pow(2, i));
  }
  
  const total = rawWeights.reduce((a, b) => a + b, 0);
  return rawWeights.map(w => w / total);
}

/**
 * Time Growth Model (Reverse Decay): Weight decreases towards conversion
 */
function timeGrowthModel(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [1];
  
  // Reverse exponential: weight = 2^(count - 1 - position)
  const rawWeights: number[] = [];
  for (let i = 0; i < count; i++) {
    rawWeights.push(Math.pow(2, count - 1 - i));
  }
  
  const total = rawWeights.reduce((a, b) => a + b, 0);
  return rawWeights.map(w => w / total);
}

/**
 * Custom Model: User-defined weights
 */
function customModel(count: number, settings?: CustomModelSettings): number[] {
  if (count === 0) return [];
  if (count === 1) return [1];
  
  const {
    firstTouchWeight = 40,
    lastTouchWeight = 40,
    middleTouchesWeight = 20
  } = settings || {};
  
  // Normalize weights to sum to 100
  const total = firstTouchWeight + lastTouchWeight + middleTouchesWeight;
  const normalizedFirst = firstTouchWeight / total;
  const normalizedLast = lastTouchWeight / total;
  const normalizedMiddle = middleTouchesWeight / total;
  
  if (count === 2) {
    const sum = normalizedFirst + normalizedLast;
    return [normalizedFirst / sum, normalizedLast / sum];
  }
  
  const weights = new Array(count).fill(0);
  weights[0] = normalizedFirst;
  weights[count - 1] = normalizedLast;
  
  const middleWeight = normalizedMiddle / (count - 2);
  for (let i = 1; i < count - 1; i++) {
    weights[i] = middleWeight;
  }
  
  return weights;
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: AttributionModel): string {
  const names: Record<AttributionModel, string> = {
    first_click: 'Первый клик',
    last_click: 'Последний клик',
    last_paid_click: 'Последний платный клик',
    linear: 'Линейная',
    u_shape: 'U-Shape',
    time_decay: 'Линейный рост',
    time_growth: 'Линейный спад',
    custom: 'Собственная модель',
  };
  return names[model];
}

/**
 * Get model description
 */
export function getModelDescription(model: AttributionModel): string {
  const descriptions: Record<AttributionModel, string> = {
    first_click: '100% ценности первому источнику. Оценка охвата и узнаваемости.',
    last_click: '100% ценности последнему касанию перед заявкой.',
    last_paid_click: '100% последнему платному переходу (игнорируя прямые заходы).',
    linear: 'Ценность распределяется поровну между всеми касаниями.',
    u_shape: '40% первому и последнему касанию, 20% — промежуточным.',
    time_decay: 'Вес касания увеличивается по мере приближения к покупке.',
    time_growth: 'Вес касания уменьшается от первого к последнему.',
    custom: 'Ручная настройка весов для первого, последнего и промежуточных касаний.',
  };
  return descriptions[model];
}

/**
 * Aggregate attribution results by channel
 */
export interface ChannelAttribution {
  channelName: string;
  sourceType: string;
  visits: number;
  leads: number;
  sales: number;
  revenue: number;
  attributedRevenue: number;
  attributedProfit: number;
  assistedConversions: number;
  cpl: number;
  cac: number;
  roi: number;
}

export function aggregateByChannel(
  attributionWeights: { channelName: string; sourceType: string; weight: number; attributedRevenue: number; attributedProfit: number }[],
  channelStats: Map<string, { visits: number; leads: number; sales: number; spend: number }>
): ChannelAttribution[] {
  const channelMap = new Map<string, ChannelAttribution>();
  
  for (const aw of attributionWeights) {
    const key = aw.channelName;
    const existing = channelMap.get(key);
    const stats = channelStats.get(key) || { visits: 0, leads: 0, sales: 0, spend: 0 };
    
    if (existing) {
      existing.attributedRevenue += aw.attributedRevenue;
      existing.attributedProfit += aw.attributedProfit;
      if (aw.weight > 0 && aw.weight < 1) {
        existing.assistedConversions += 1;
      }
    } else {
      channelMap.set(key, {
        channelName: aw.channelName,
        sourceType: aw.sourceType,
        visits: stats.visits,
        leads: stats.leads,
        sales: stats.sales,
        revenue: 0,
        attributedRevenue: aw.attributedRevenue,
        attributedProfit: aw.attributedProfit,
        assistedConversions: aw.weight > 0 && aw.weight < 1 ? 1 : 0,
        cpl: stats.leads > 0 ? stats.spend / stats.leads : 0,
        cac: stats.sales > 0 ? stats.spend / stats.sales : 0,
        roi: stats.spend > 0 ? ((aw.attributedRevenue - stats.spend) / stats.spend) * 100 : 0,
      });
    }
  }
  
  // Recalculate ROI for each channel
  for (const [key, channel] of channelMap) {
    const stats = channelStats.get(key);
    if (stats && stats.spend > 0) {
      channel.roi = ((channel.attributedRevenue - stats.spend) / stats.spend) * 100;
    }
  }
  
  return Array.from(channelMap.values());
}
