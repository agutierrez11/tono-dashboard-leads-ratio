import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AvatarSelectorProps {
  selectedType: string;
  selectedStyle: string;
  onSelect: (type: string, style: string) => void;
}

const avatarOptions = [
  { type: "male", style: "professional", emoji: "👨‍💼", label: "Ejecutivo" },
  { type: "male", style: "casual", emoji: "🧑", label: "Casual" },
  { type: "male", style: "tech", emoji: "👨‍💻", label: "Tech" },
  { type: "female", style: "professional", emoji: "👩‍💼", label: "Ejecutiva" },
  { type: "female", style: "casual", emoji: "👩", label: "Casual" },
  { type: "female", style: "tech", emoji: "👩‍💻", label: "Tech" },
  { type: "robot", style: "default", emoji: "🤖", label: "Robot" },
  { type: "shark", style: "default", emoji: "🦈", label: "Shark" },
];

export const AvatarSelector = ({ selectedType, selectedStyle, onSelect }: AvatarSelectorProps) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {avatarOptions.map((avatar) => (
        <Button
          key={`${avatar.type}-${avatar.style}`}
          variant="outline"
          className={cn(
            "h-16 flex flex-col items-center justify-center gap-1 transition-all",
            selectedType === avatar.type && selectedStyle === avatar.style && 
            "ring-2 ring-primary bg-primary/10 border-primary"
          )}
          onClick={() => onSelect(avatar.type, avatar.style)}
        >
          <span className="text-2xl">{avatar.emoji}</span>
          <span className="text-[10px] text-muted-foreground">{avatar.label}</span>
        </Button>
      ))}
    </div>
  );
};
