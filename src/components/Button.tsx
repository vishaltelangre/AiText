import React from "react";
import clsx from "clsx";
import { LoadingSpinnerIcon } from "@/components/Icons";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "icon";
  size?: "small" | "normal";
  loading?: boolean;
  type?: "button" | "submit" | "reset";
};

export const Button = ({
  children,
  variant = "primary",
  size = "normal",
  type = "button",
  loading = false,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        "ait-flex ait-items-center ait-gap-1 ait-rounded-lg ait-text-sm ait-font-medium ait-transition-colors disabled:ait-cursor-not-allowed disabled:ait-opacity-50",
        variant === "primary" && "ait-bg-primary ait-text-white hover:ait-bg-primary-hover",
        variant === "secondary" &&
          "ait-bg-gray-100 ait-text-gray-700 hover:ait-bg-gray-200 hover:ait-text-gray-800",
        variant === "icon" && "ait-p-1 ait-text-gray-400 hover:ait-text-gray-600",
        variant !== "icon" && "focus:ait-ring-primary/50 focus:ait-ring-2 focus:ait-ring-offset-2",
        size === "small" && "ait-text-xs",
        variant !== "icon" && size === "small" && "ait-px-3 ait-py-1",
        variant !== "icon" && size === "normal" && "ait-px-4 ait-py-2",
        className
      )}
      type={type}
      {...props}
    >
      {loading ? <LoadingSpinnerIcon /> : null}
      {children}
    </button>
  );
};

export default Button;
