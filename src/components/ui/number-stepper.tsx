import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  className?: string;
  ariaLabel?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled,
  unit,
  className,
  ariaLabel,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const apply = (n: number) => onChange(clamp(Math.round(n)));

  const dec = () => apply((value || 0) - step);
  const inc = () => apply((value || 0) + step);

  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const numbers = React.useMemo(() => {
    const arr: number[] = [];
    // guard against massive ranges
    const safeMax = Math.min(max, min + 1000 * step);
    for (let n = min; n <= safeMax; n += step) arr.push(Math.round(n));
    return arr;
  }, [min, max, step]);

  React.useEffect(() => {
    if (!open) return;
    // Scroll currently selected into view
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-value="${Number.isFinite(value) ? value : 0}"]`
    );
    el?.scrollIntoView({ block: 'center' });
  }, [open, value]);

  const onPick = (n: number) => {
    apply(n);
    setOpen(false);
  };

  return (
    <div className={`flex items-center flex-wrap gap-2 min-w-0 ${className || ''}`} aria-label={ariaLabel}>
      <div className="flex items-center border rounded-md shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={dec}
          disabled={disabled || value <= min}
          aria-label="decrement"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-20 sm:w-24 h-10 text-center outline-none"
              onClick={() => !disabled && setOpen(true)}
              aria-label="open number picker"
            >
              <Input
                readOnly
                value={Number.isFinite(value) ? value : 0}
                className="w-20 sm:w-24 h-10 border-0 text-center pointer-events-none"
                disabled={disabled}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-32" align="center">
            <ScrollArea className="h-64">
              <div ref={listRef} className="py-1">
                {numbers.map((n) => {
                  const active = n === (Number.isFinite(value) ? value : 0);
                  return (
                    <button
                      type="button"
                      key={n}
                      data-value={n}
                      onClick={() => onPick(n)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${active ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={inc}
          disabled={disabled || value >= max}
          aria-label="increment"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {unit && <span className="text-sm text-muted-foreground select-none">{unit}</span>}
    </div>
  );
}

export default NumberStepper;
