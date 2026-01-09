"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange as DateRangeType } from "@/lib/types/station";

interface DateRangePickerProps {
  dateRange: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  maxDate?: Date;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  maxDate = new Date(),
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: dateRange.from,
    to: dateRange.to,
  });

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    
    if (selectedDate?.from && selectedDate?.to) {
      onDateRangeChange({
        from: selectedDate.from,
        to: selectedDate.to,
      });
    } else if (selectedDate?.from && !selectedDate?.to) {
      // Only start date selected, wait for end date
      // Don't trigger onChange yet
    }
  };

  React.useEffect(() => {
    setDate({
      from: dateRange.from,
      to: dateRange.to,
    });
  }, [dateRange]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(dateToCheck: Date) => dateToCheck > maxDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}