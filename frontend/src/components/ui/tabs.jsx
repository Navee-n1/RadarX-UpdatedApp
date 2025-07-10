import * as TabsPrimitive from "@radix-ui/react-tabs";
import React from "react";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef(({ className = "", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={`inline-flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
    {...props}
  />
));

export const TabsTrigger = React.forwardRef(({ className = "", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={`px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white ${className}`}
    {...props}
  />
));

export const TabsContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={`mt-4 w-full ${className}`}
    {...props}
  />
));


