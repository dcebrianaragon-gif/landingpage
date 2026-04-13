import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext(null);

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const contextValue = useMemo(
    () => ({
      value: currentValue,
      setValue: onValueChange ?? setInternalValue,
    }),
    [currentValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn('inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, value, ...props }) {
  const context = useContext(TabsContext);
  const active = context?.value === value;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
        className
      )}
      onClick={() => context?.setValue(value)}
      {...props}
    />
  );
}

function TabsContent({ className, value, ...props }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) {
    return null;
  }

  return <div className={cn(className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
