import { 
  MousePointer, 
  MousePointerClick, 
  DollarSign, 
  Equal, 
  Hexagon,
  TrendingUp,
  TrendingDown,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AttributionModel, 
  getModelDisplayName, 
  getModelDescription 
} from '@/lib/attribution';

interface AttributionModelSelectorProps {
  selectedModel: AttributionModel;
  onModelChange: (model: AttributionModel) => void;
  compareModel: AttributionModel | null;
  onCompareModelChange: (model: AttributionModel | null) => void;
}

const modelIcons: Record<AttributionModel, React.ReactNode> = {
  first_click: <MousePointer className="w-4 h-4" />,
  last_click: <MousePointerClick className="w-4 h-4" />,
  last_paid_click: <DollarSign className="w-4 h-4" />,
  linear: <Equal className="w-4 h-4" />,
  u_shape: <Hexagon className="w-4 h-4" />,
  time_decay: <TrendingUp className="w-4 h-4" />,
  time_growth: <TrendingDown className="w-4 h-4" />,
  custom: <Settings className="w-4 h-4" />,
};

const models: AttributionModel[] = [
  'first_click',
  'last_click',
  'last_paid_click',
  'linear',
  'u_shape',
  'time_decay',
  'time_growth',
  'custom',
];

export const AttributionModelSelector = ({
  selectedModel,
  onModelChange,
  compareModel,
  onCompareModelChange,
}: AttributionModelSelectorProps) => {
  const handleCompareToggle = (model: AttributionModel) => {
    if (model === selectedModel) return;
    if (compareModel === model) {
      onCompareModelChange(null);
    } else {
      onCompareModelChange(model);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {models.map((model) => {
          const isSelected = selectedModel === model;
          const isComparing = compareModel === model;
          
          return (
            <div
              key={model}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : isComparing
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onModelChange(model)}
            >
              {isComparing && (
                <Badge className="absolute -top-2 -right-2 text-xs bg-accent">
                  Сравнение
                </Badge>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  {modelIcons[model]}
                </div>
                <span className="font-medium text-sm">{getModelDisplayName(model)}</span>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2">
                {getModelDescription(model)}
              </p>

              {!isSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2 text-xs h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompareToggle(model);
                  }}
                >
                  {isComparing ? 'Убрать' : 'Сравнить'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {compareModel && (
        <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg">
          <Badge variant="outline" className="bg-primary/10">
            {getModelDisplayName(selectedModel)}
          </Badge>
          <span className="text-muted-foreground">vs</span>
          <Badge variant="outline" className="bg-accent/10">
            {getModelDisplayName(compareModel)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => onCompareModelChange(null)}
          >
            Отменить сравнение
          </Button>
        </div>
      )}
    </div>
  );
};
