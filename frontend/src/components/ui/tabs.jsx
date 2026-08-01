import { useState, createContext, useContext } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext();

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [tab, setTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : tab;
  const setActiveTab = onValueChange || setTab;
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, value, children, ...props }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-white text-gray-950 shadow-sm",
        className,
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ className, value, children, ...props }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return (
    <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2", className)} {...props}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
