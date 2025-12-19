import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Gartic-style "Chunky" buttons
  const baseStyles = "relative px-6 py-3 rounded-xl font-bold text-lg transition-transform active:translate-y-1 active:shadow-none border-b-4 border-r-2";
  
  const variants = {
    primary: "bg-fun-blue text-white border-blue-800 shadow-[4px_4px_0px_rgba(30,58,138,0.4)] hover:bg-blue-400",
    success: "bg-fun-green text-white border-green-700 shadow-[4px_4px_0px_rgba(21,128,61,0.4)] hover:bg-green-400",
    secondary: "bg-white text-gray-700 border-gray-400 shadow-[4px_4px_0px_rgba(156,163,175,0.4)] hover:bg-gray-50",
    danger: "bg-fun-red text-white border-red-800 shadow-[4px_4px_0px_rgba(153,27,27,0.4)] hover:bg-red-400"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};