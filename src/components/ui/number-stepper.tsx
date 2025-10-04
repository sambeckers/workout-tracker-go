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
  buttonStep?: number; // Separate step for +/- buttons (quick adjustments)
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
  buttonStep, // If not provided, falls back to step
  disabled,
  unit,
  className,
  ariaLabel,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const apply = (n: number) => {
    // Determine decimal places based on step size (for dropdown precision)
    const decimalPlaces = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
    const rounded = parseFloat(n.toFixed(decimalPlaces));
    onChange(clamp(rounded));
  };

  const actualButtonStep = buttonStep ?? step;
  const dec = () => apply((value || 0) - actualButtonStep);
  const inc = () => apply((value || 0) + actualButtonStep);

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  
  const numbers = React.useMemo(() => {
    const arr: number[] = [];
    // guard against massive ranges
    const safeMax = Math.min(max, min + 1000 * step);
    
    // Determine decimal places based on step size to avoid rounding errors
    const decimalPlaces = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
    
    for (let n = min; n <= safeMax; n += step) {
      // Round to appropriate decimal places to avoid floating point precision issues
      const rounded = parseFloat(n.toFixed(decimalPlaces));
      arr.push(rounded);
    }
    return arr;
  }, [min, max, step]);

  React.useEffect(() => {
    if (!open) return;
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const el = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-value="${Number.isFinite(value) ? value : 0}"]`
      );
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [open, value]);

  const onPick = (n: number) => {
    apply(n);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      apply(parsed);
    }
    setInputValue('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
      setOpen(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
      setOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setInputValue(String(Number.isFinite(value) ? value : 0));
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handlePopoverTriggerClick = () => {
    if (disabled) return;
    setOpen(true);
    // Immediately focus and prepare for typing
    setIsEditing(true);
    setInputValue(String(Number.isFinite(value) ? value : 0));
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
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
              className="w-20 sm:w-24 h-10 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              onClick={handlePopoverTriggerClick}
              aria-label="open number picker"
            >
              <Input
                ref={inputRef}
                value={isEditing ? inputValue : (Number.isFinite(value) ? value : 0)}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                className="w-20 sm:w-24 h-10 border-0 text-center"
                disabled={disabled}
                type="text"
                inputMode="decimal"
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
