import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Wand2, 
  Loader2,
  Trash2,
  Play,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';
import { AdAsset, useAdAssets } from '@/hooks/useAdAssets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreativeCenterTabProps {
  projectId: string | null;
}

type PreviewFormat = 'feed' | 'stories';

export const CreativeCenterTab = ({ projectId }: CreativeCenterTabProps) => {
  const { assets, loading, createAsset, deleteAsset } = useAdAssets(projectId);
  const [platform, setPlatform] = useState<'facebook' | 'tiktok' | 'google'>('facebook');
  const [productDescription, setProductDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    headlines: string[];
    descriptions: string[];
    primaryText: string;
    hashtags: string[];
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('feed');
  const [selectedAsset, setSelectedAsset] = useState<AdAsset | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} не является изображением или видео`);
        continue;
      }

      // Check file extensions
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (isImage && !['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
        toast.error(`${file.name}: поддерживаются только .jpg, .png, .webp`);
        continue;
      }

      // Mock URL - в реальном приложении это будет URL из Storage
      const mockUrl = URL.createObjectURL(file);
      
      if (projectId) {
        const newAsset = await createAsset({
          project_id: projectId,
          campaign_id: null,
          asset_type: isImage ? 'image' : 'video',
          file_url: mockUrl,
          file_name: file.name,
          aspect_ratio: null,
          platform: platform,
          ai_headlines: [],
          ai_descriptions: [],
          ai_primary_text: null,
          ai_hashtags: null,
          ai_score: Math.floor(Math.random() * 30) + 70,
          status: 'draft',
        });
        
        if (newAsset) {
          setSelectedAsset(newAsset);
          toast.success(`${isImage ? 'Изображение' : 'Видео'} загружено`);
        }
      }
    }
  };

  const generateContent = async () => {
    if (!productDescription.trim()) {
      toast.error('Введите описание продукта');
      return;
    }

    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          platform,
          productDescription: productDescription.trim(),
          language: 'ru',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.content) {
        setGeneratedContent({
          headlines: data.content.headlines || [],
          descriptions: data.content.descriptions || [],
          primaryText: data.content.primaryText || '',
          hashtags: data.content.hashtags || [],
        });
        toast.success('Контент сгенерирован!');
      } else {
        throw new Error('No content in response');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('429')) {
        toast.error('Превышен лимит запросов. Попробуйте позже.');
      } else if (error.message?.includes('402')) {
        toast.error('Закончились кредиты API.');
      } else {
        toast.error('Ошибка генерации. Попробуйте снова.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Скопировано!');
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Platform Selector */}
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as any)}>
        <TabsList className="w-full justify-start bg-muted/50 dark:bg-muted/30">
          <TabsTrigger value="facebook" className="gap-2">
            <div className="w-4 h-4 bg-[#1877F2] rounded text-[10px] text-white font-bold flex items-center justify-center">f</div>
            Facebook / Instagram
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2">
            <div className="w-4 h-4 bg-[#EA4335] rounded text-[10px] text-white font-bold flex items-center justify-center">G</div>
            Google Ads
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-2">
            <div className="w-4 h-4 bg-black dark:bg-white rounded text-[10px] text-white dark:text-black font-bold flex items-center justify-center">T</div>
            TikTok
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Uploader - Цех 1 */}
        <Card className="border-border bg-background dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Upload className="w-4 h-4" />
              Лаборатория Креатива
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground bg-muted/20'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-muted dark:bg-muted/50 rounded-full">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Перетащите файлы сюда</p>
                  <p className="text-sm text-muted-foreground">
                    или <label className="text-primary cursor-pointer hover:underline">
                      выберите файлы
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp,video/*"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Изображения: .jpg, .png, .webp | Видео: любые форматы
                  </p>
                </div>
              </div>
            </div>

            {/* Asset Library */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Библиотека креативов</h4>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                  Нет загруженных креативов
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-3 gap-2">
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        className={`relative group aspect-square bg-muted dark:bg-muted/50 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedAsset?.id === asset.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-border'
                        }`}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        {asset.asset_type === 'image' ? (
                          <img
                            src={asset.file_url}
                            alt={asset.file_name || 'Asset'}
                            className="w-full h-full object-cover object-center"
                            style={{ objectPosition: 'center top' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black/50">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        )}
                        
                        {/* AI Score */}
                        {asset.ai_score && (
                          <div className={`absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold ${getAIScoreColor(asset.ai_score)}`}>
                            {asset.ai_score}
                          </div>
                        )}
                        
                        {/* Type badge */}
                        <div className="absolute top-1 right-1">
                          {asset.asset_type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                          ) : (
                            <Video className="w-4 h-4 text-white drop-shadow" />
                          )}
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAsset(asset.id);
                            if (selectedAsset?.id === asset.id) {
                              setSelectedAsset(null);
                            }
                          }}
                          className="absolute bottom-1 right-1 p-1 bg-destructive/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Copywriter - Цех 2 */}
        <Card className="border-border bg-background dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Wand2 className="w-4 h-4 text-primary" />
              AI Анализ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Опишите ваш продукт/услугу</Label>
              <Textarea
                placeholder="Например: Онлайн-курс по маркетингу для начинающих предпринимателей..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
                className="bg-background dark:bg-muted/20 text-foreground border-border"
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={generateContent}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Сгенерировать для {platform === 'facebook' ? 'Facebook' : platform === 'google' ? 'Google' : 'TikTok'}
            </Button>

            {/* Generated Content */}
            {generatedContent && (
              <ScrollArea className="h-[280px] border border-border rounded-lg p-4 bg-muted/10 dark:bg-muted/5">
                <div className="space-y-4">
                  {/* Headlines */}
                  {generatedContent.headlines.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <Badge variant="outline" className="text-xs border-border">
                          {platform === 'google' ? '15 заголовков' : 'Заголовки'}
                        </Badge>
                      </h4>
                      {generatedContent.headlines.map((headline, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-background dark:bg-muted/20 rounded-lg group border border-border/50"
                        >
                          <span className="text-sm text-foreground">{headline}</span>
                          <button
                            onClick={() => copyToClipboard(headline, `h-${i}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                          {copiedIndex === `h-${i}` ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Descriptions */}
                  {generatedContent.descriptions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        <Badge variant="outline" className="text-xs border-border">Описания</Badge>
                      </h4>
                      {generatedContent.descriptions.map((desc, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between p-2 bg-background dark:bg-muted/20 rounded-lg group border border-border/50"
                        >
                          <span className="text-sm text-foreground">{desc}</span>
                          <button
                            onClick={() => copyToClipboard(desc, `d-${i}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                          {copiedIndex === `d-${i}` ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Primary Text */}
                  {generatedContent.primaryText && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        <Badge variant="outline" className="text-xs border-border">Основной текст</Badge>
                      </h4>
                      <div className="p-3 bg-background dark:bg-muted/20 rounded-lg group relative border border-border/50">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
                          {generatedContent.primaryText}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(generatedContent.primaryText, 'primary')}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedIndex === 'primary' ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hashtags */}
                  {generatedContent.hashtags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        <Badge variant="outline" className="text-xs border-border">Хэштеги</Badge>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => copyToClipboard(tag, `tag-${i}`)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Live Preview - Цех 3 */}
        <Card className="border-border bg-background dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Smartphone className="w-4 h-4" />
              Центр Запуска
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Selector */}
            <div className="flex gap-2">
              <Button
                variant={previewFormat === 'feed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewFormat('feed')}
                className="flex-1 text-xs"
              >
                Лента (4:5)
              </Button>
              <Button
                variant={previewFormat === 'stories' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewFormat('stories')}
                className="flex-1 text-xs"
              >
                Stories (9:16)
              </Button>
            </div>

            {/* Preview Frame */}
            <div className="flex flex-col items-center">
              <div
                className={`relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-300 dark:border-gray-700 ${
                  previewFormat === 'feed' 
                    ? 'w-full aspect-[4/5]' 
                    : 'w-[200px] aspect-[9/16]'
                }`}
              >
                {selectedAsset ? (
                  <>
                    {selectedAsset.asset_type === 'image' ? (
                      <img
                        src={selectedAsset.file_url}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center top' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    {/* Instagram-like overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                      <p className="text-xs font-semibold mb-1">ваша_клиника</p>
                      {generatedContent?.primaryText && (
                        <p className="text-xs line-clamp-2">
                          {generatedContent.primaryText.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20 dark:bg-muted/10">
                    <div className="text-center p-4">
                      <Smartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Выберите креатив для предпросмотра
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Button */}
              <Button
                className="w-full mt-4 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
                disabled={!selectedAsset}
              >
                <Sparkles className="w-4 h-4" />
                ЗАПУСТИТЬ В ОРБИТУ 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
