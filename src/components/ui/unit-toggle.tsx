import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface UnitToggleProps {
  units: string[];
  value: string;
  onChange: (unit: string) => void;
  className?: string;
}

export function UnitToggle({ units, value, onChange, className }: UnitToggleProps) {
  const [open, setOpen] = useState(false);
  const currentIndex = units.indexOf(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("min-w-12 h-9 px-2", className)}
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-12 p-1" align="center">
        <div className="flex flex-col gap-1">
          {units.map((unit, index) => (
            <Button
              key={unit}
              variant={unit === value ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                onChange(unit);
                setOpen(false);
              }}
            >
              {unit}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}