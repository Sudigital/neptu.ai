import { Button } from "@/components/ui/button";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export function SecretReveal({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs break-all">
        {visible ? secret : "•".repeat(40)}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </Button>
      <CopyButton text={secret} />
    </div>
  );
}
