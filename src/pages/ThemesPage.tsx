import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Palette, Image, Sparkles, Check, Upload, Link, X, Blend, Contrast, Paintbrush, Layers } from 'lucide-react';
import { toast } from 'sonner';

const themeColors = [
  { id: 'red', name: '亮红色', color: 'hsl(0 80% 55%)' },
  { id: 'blue', name: '海洋蓝', color: 'hsl(220 70% 50%)' },
  { id: 'green', name: '森林绿', color: 'hsl(150 60% 40%)' },
  { id: 'orange', name: '日落橙', color: 'hsl(30 90% 50%)' },
  { id: 'pink', name: '樱花粉', color: 'hsl(330 70% 60%)' },
] as const;

// 二次元背景预设 - 萌妹子
const animeBgPresets = [
  { id: 'anime3', name: '蓝色街道', value: 'https://cdn.pixabay.com/photo/2024/05/26/15/27/anime-8788959_1280.jpg' },
  { id: 'anime4', name: '星穹铁道', value: 'https://files.seeusercontent.com/2026/03/13/5nQg/gg.jpg' },
  { id: 'anime5', name: '随机老婆', value: 'https://api.paugram.com/wallpaper' },
  { id: 'anime6', name: '废墟少女', value: 'https://files.seeusercontent.com/2026/03/13/w5oD/aa.jpg' },
];

// 图片预设背景
const imagePresets = [
  { id: 'starry', name: '黑色', value: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&q=80' },
  { id: 'mountain', name: '山峦', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { id: 'ocean', name: '海洋', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' },
  { id: 'forest', name: '森林', value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
  { id: 'city', name: '城市', value: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80' },
  { id: 'aurora', name: '波浪', value: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80' },
];

// 渐变预设背景
const gradientPresets = [
  { id: 'gradient1', name: '极光紫', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient2', name: '海洋蓝', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'gradient3', name: '日落橙', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'gradient4', name: '森林绿', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'gradient5', name: '星空黑', value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' },
];

// ICON 颜色选项
const iconColorOptions = [
  { id: 'colored', name: '彩色', icon: '🎨' },
  { id: 'white', name: '白色', icon: '⚪' },
  { id: 'black', name: '黑色', icon: '⚫' },
] as const;

export default function ThemesPage() {
  const {
    mode, style, color, backgroundImage, blurIntensity,
    iconColor, themePreset,
    setMode, setStyle, setColor, setBackgroundImage, setBlurIntensity,
    setIconColor, setThemePreset, saveToBackend
  } = useTheme();
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBackgroundImage(dataUrl);
      toast.success('背景图片已上传');
    };
    reader.readAsDataURL(file);
  };

  const handleCustomUrl = () => {
    if (!customUrl.trim()) {
      toast.error('请输入图片链接');
      return;
    }
    setBackgroundImage(customUrl);
    setCustomUrl('');
    toast.success('背景图片已应用');
  };

  const clearBackground = () => {
    setBackgroundImage(null);
    toast.success('背景已清除');
  };

  // 选择背景时自动切换到毛玻璃风格
  const handleSelectBackground = (value: string | null) => {
    setBackgroundImage(value);
    if (value && style !== 'glassmorphism') {
      setStyle('glassmorphism');
      toast.success('已自动切换到毛玻璃风格以显示背景');
    }
  };

  const isGradient = (value: string | null) => value?.startsWith('linear-gradient');
  const allPresetValues = [...imagePresets.map(p => p.value), ...gradientPresets.map(p => p.value)];
  const isCustomImage = backgroundImage && !allPresetValues.includes(backgroundImage);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Palette className="w-8 h-8" />
          主题设置
        </h1>
        <p className="text-muted-foreground mt-1">自定义应用外观和主题</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Color Mode */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mode === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              颜色模式
            </CardTitle>
            <CardDescription>选择亮色或暗色主题</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={mode === 'light' ? 'default' : 'outline'}
                className="flex-1 h-20 flex-col gap-2"
                onClick={() => setMode('light')}
              >
                <Sun className="w-6 h-6" />
                亮色模式
              </Button>
              <Button
                variant={mode === 'dark' ? 'default' : 'outline'}
                className="flex-1 h-20 flex-col gap-2"
                onClick={() => setMode('dark')}
              >
                <Moon className="w-6 h-6" />
                暗色模式
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Style */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              界面风格
            </CardTitle>
            <CardDescription>选择纯色或毛玻璃效果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={style === 'solid' ? 'default' : 'outline'}
                className="flex-1 h-20 flex-col gap-2"
                onClick={() => setStyle('solid')}
              >
                <div className="w-8 h-8 rounded-lg bg-primary" />
                纯色风格
              </Button>
              <Button
                variant={style === 'glassmorphism' ? 'default' : 'outline'}
                className="flex-1 h-20 flex-col gap-2"
                onClick={() => setStyle('glassmorphism')}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/50 to-accent/50 backdrop-blur border border-border/50" />
                毛玻璃风格
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Colors */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              主题颜色
            </CardTitle>
            <CardDescription>选择您喜欢的主题色</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {themeColors.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setColor(theme.id)}
                  className={`relative aspect-square rounded-xl transition-all hover:scale-105 ${
                    color === theme.id ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                  }`}
                  style={{ backgroundColor: theme.color }}
                >
                  {color === theme.id && (
                    <Check className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {themeColors.map((theme) => (
                <span
                  key={theme.id}
                  className={`text-xs px-2 py-1 rounded-full ${
                    color === theme.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {theme.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Preset (Shadcn) */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              主题预设
            </CardTitle>
            <CardDescription>选择主题风格预设</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={themePreset === 'default' ? 'default' : 'outline'}
                className="flex-1 h-20 flex-col gap-2"
                onClick={() => {
                  setThemePreset('default');
                  saveToBackend();
                }}
              >
                <Palette className="w-6 h-6" />
                默认风格
              </Button>
              <Button
                variant={themePreset === 'shadcn' ? 'default' : 'outline'}
                className="flex-1 h-20 flex-col gap-2"
                onClick={() => {
                  setThemePreset('shadcn');
                  saveToBackend();
                }}
              >
                <div className="w-6 h-6 rounded border-2 border-current" />
                Shadcn 风格
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {themePreset === 'shadcn'
                ? 'Shadcn 风格：纯黑白配色，简洁现代的 UI 风格'
                : '默认风格：彩色主题，多种配色方案可选'}
            </p>
          </CardContent>
        </Card>

        {/* Icon Color */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paintbrush className="w-5 h-5" />
              ICON 颜色
            </CardTitle>
            <CardDescription>选择侧边栏和按钮图标的颜色</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {iconColorOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={iconColor === option.id ? 'default' : 'outline'}
                  className="flex-1 h-20 flex-col gap-2"
                  onClick={() => {
                    setIconColor(option.id);
                    saveToBackend();
                  }}
                >
                  <span className="text-2xl">{option.icon}</span>
                  {option.name}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {iconColor === 'colored' ? '使用主题色图标' :
               iconColor === 'white' ? '使用白色图标（适合深色背景）' :
               '使用黑色图标（适合浅色背景）'}
            </p>
          </CardContent>
        </Card>

        {/* Blur Intensity - Only show when glassmorphism is active */}
        {style === 'glassmorphism' && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Blend className="w-5 h-5" />
                毛玻璃强度
              </CardTitle>
              <CardDescription>调整模糊效果的强度</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">模糊强度</span>
                  <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {blurIntensity}px
                  </span>
                </div>
                <Slider
                  value={[blurIntensity]}
                  onValueChange={(value) => setBlurIntensity(value[0])}
                  min={0}
                  max={24}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>清晰</span>
                  <span>适中</span>
                  <span>模糊</span>
                </div>
              </div>
              
              {/* Quick presets */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlurIntensity(4)}
                  className={blurIntensity === 4 ? 'border-primary' : ''}
                >
                  轻微
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlurIntensity(12)}
                  className={blurIntensity === 12 ? 'border-primary' : ''}
                >
                  标准
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlurIntensity(20)}
                  className={blurIntensity === 20 ? 'border-primary' : ''}
                >
                  强烈
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Background Settings */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              背景设置
            </CardTitle>
            <CardDescription>选择预设背景或上传自定义图片（仅在毛玻璃风格下生效）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* No Background Option */}
            <div>
              <Label className="text-sm mb-2 block">默认</Label>
              <button
                onClick={() => handleSelectBackground(null)}
                className={`relative aspect-video w-24 rounded-lg overflow-hidden transition-all hover:scale-105 ${
                  backgroundImage === null ? 'ring-2 ring-primary' : 'ring-1 ring-border'
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">无背景</span>
                </div>
                {backgroundImage === null && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground drop-shadow" />
                  </div>
                )}
              </button>
            </div>

            {/* ACGN Background Presets */}
            <div>
              <Label className="text-sm mb-2 block">二次元背景</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {animeBgPresets.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      handleSelectBackground(bg.value);
                    }}
                    className={`relative aspect-video rounded-lg overflow-hidden transition-all hover:scale-105 ${
                      backgroundImage === bg.value ? 'ring-2 ring-primary' : 'ring-1 ring-border'
                    }`}
                  >
                    <img
                      src={bg.value}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {backgroundImage === bg.value && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground drop-shadow" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 px-1 rounded">
                      {bg.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preset Backgrounds */}
            <div>
              <Label className="text-sm mb-2 block">图片背景</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {imagePresets.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleSelectBackground(bg.value)}
                    className={`relative aspect-video rounded-lg overflow-hidden transition-all hover:scale-105 ${
                      backgroundImage === bg.value ? 'ring-2 ring-primary' : 'ring-1 ring-border'
                    }`}
                  >
                    <img
                      src={bg.value}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {backgroundImage === bg.value && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground drop-shadow" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 px-1 rounded">
                      {bg.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Preset Backgrounds */}
            <div>
              <Label className="text-sm mb-2 block">渐变背景</Label>
              <div className="grid grid-cols-5 gap-3">
                {gradientPresets.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleSelectBackground(bg.value)}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all hover:scale-105 ${
                      backgroundImage === bg.value ? 'ring-2 ring-primary' : 'ring-1 ring-border'
                    }`}
                  >
                    <div 
                      className="w-full h-full"
                      style={{ background: bg.value }}
                    />
                    {backgroundImage === bg.value && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {gradientPresets.map((bg) => (
                  <span
                    key={bg.id}
                    className={`text-xs px-2 py-1 rounded-full ${
                      backgroundImage === bg.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {bg.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div className="space-y-3">
              <Label className="text-sm">自定义背景</Label>
              
              {/* File Upload */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  上传图片
                </Button>
              </div>

              {/* URL Input */}
              <div className="flex gap-2">
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="或输入图片链接..."
                  className="flex-1"
                />
                <Button onClick={handleCustomUrl} size="icon" variant="outline">
                  <Link className="w-4 h-4" />
                </Button>
              </div>

              {/* Current Custom Background Preview */}
              {isCustomImage && (
                <div className="relative rounded-lg overflow-hidden aspect-video">
                  {backgroundImage.startsWith('data:') || backgroundImage.startsWith('http') ? (
                    <img 
                      src={backgroundImage} 
                      alt="当前背景" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{ background: backgroundImage }}
                    />
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={clearBackground}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <span className="absolute bottom-1 left-1 text-xs bg-background/80 px-2 py-0.5 rounded">
                    自定义背景
                  </span>
                </div>
              )}
            </div>

            {style !== 'glassmorphism' && (
              <p className="text-xs text-muted-foreground border-l-2 border-primary/50 pl-2">
                提示：请先切换到毛玻璃风格以查看背景效果
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>预览效果</CardTitle>
          <CardDescription>当前主题设置的预览</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-primary text-primary-foreground">
              Primary 颜色
            </div>
            <div className="p-4 rounded-lg bg-secondary text-secondary-foreground">
              Secondary 颜色
            </div>
            <div className="p-4 rounded-lg bg-accent text-accent-foreground">
              Accent 颜色
            </div>
            <div className="p-4 rounded-lg bg-muted text-muted-foreground">
              Muted 颜色
            </div>
            <div className="p-4 rounded-lg bg-card text-card-foreground border">
              Card 颜色
            </div>
            <div className="p-4 rounded-lg bg-destructive text-destructive-foreground">
              Destructive 颜色
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
