import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm", className)} {...props} />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-sm font-semibold text-gray-700 leading-none tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-gray-500", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
