"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-white transition-all gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-main-foreground bg-main border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border)] data-[clicked=true]:!translate-x-boxShadowX data-[clicked=true]:!translate-y-boxShadowY data-[clicked=true]:!shadow-none data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-shadow",
        noShadow: 
          "text-main-foreground bg-main border-2 border-border active:scale-[0.98] data-[clicked=true]:!scale-[0.98] data-[clicked=true]:md:!scale-100",
        neutral:
          "bg-secondary-background text-foreground border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border)] data-[clicked=true]:!translate-x-boxShadowX data-[clicked=true]:!translate-y-boxShadowY data-[clicked=true]:!shadow-none data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-shadow",
        reverse:
          "text-main-foreground bg-main border-2 border-border hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY hover:shadow-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border)] data-[clicked=true]:!translate-x-reverseBoxShadowX data-[clicked=true]:!translate-y-reverseBoxShadowY data-[clicked=true]:!shadow-shadow data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-none",
        destructive:
          "bg-red-600 text-white border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:bg-red-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border)] data-[clicked=true]:!translate-x-boxShadowX data-[clicked=true]:!translate-y-boxShadowY data-[clicked=true]:!shadow-none data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-shadow",
        muted:
          "bg-gray-400 text-gray-800 border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:bg-gray-500 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--border)] data-[clicked=true]:!translate-x-boxShadowX data-[clicked=true]:!translate-y-boxShadowY data-[clicked=true]:!shadow-none data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-shadow",
        alert:
          "bg-[#ff00ff] text-white font-bold border-2 border-border shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--border)] hover:bg-[#ff00ff]/90 animate-pulse active:translate-x-[4px] active:translate-y-[4px] active:shadow-none data-[clicked=true]:!translate-x-[2px] data-[clicked=true]:!translate-y-[2px] data-[clicked=true]:!shadow-[2px_2px_0px_0px_var(--border)] data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-shadow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const [clicked, setClicked] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
    if (onClick) {
      onClick(e);
    }
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-clicked={clicked}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    />
  );
}

export { Button, buttonVariants };
