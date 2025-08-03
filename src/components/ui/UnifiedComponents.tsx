import { getLevelColors, getStatusColors, getScoreColors } from '../../lib/colors';

/**
 * Unified Badge Component with consistent red theme
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'level' | 'status' | 'score';
  level?: string;
  status?: string;
  score?: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  level,
  status,
  score,
  className = '' 
}) => {
  let colorClasses = '';

  switch (variant) {
    case 'level':
      colorClasses = level ? getLevelColors(level) : 'bg-gray-100 text-gray-800 border-gray-300';
      break;
    case 'status':
      colorClasses = status ? getStatusColors(status) : 'bg-gray-100 text-gray-800 border-gray-300';
      break;
    case 'score':
      colorClasses = score !== undefined ? getScoreColors(score) : 'bg-gray-100 text-gray-800 border-gray-300';
      break;
    default:
      colorClasses = 'bg-red-50 text-red-800 border-red-200';
  }

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${colorClasses} 
        ${className}
      `}
    >
      {children}
    </span>
  );
};

/**
 * Unified Button Component with consistent red theme
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-red-50 text-red-600 border border-red-600',
    ghost: 'bg-transparent hover:bg-red-50 text-red-600',
    outline: 'bg-transparent hover:bg-red-50 text-red-600 border border-red-200',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Unified Card Component with consistent styling
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-lg',
    outlined: 'bg-white border-2 border-red-200',
  };

  return (
    <div className={`rounded-lg ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

/**
 * Unified Input Component with consistent red theme
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
          placeholder-gray-500 text-gray-900
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500 ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Unified Alert Component with consistent red theme
 */
interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info',
  className = '' 
}) => {
  const variantClasses = {
    success: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-red-50 border-red-300 text-red-700',
    error: 'bg-red-50 border-red-400 text-red-600',
    info: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`
      rounded-lg border p-4 
      ${variantClasses[variant]} 
      ${className}
    `}>
      {children}
    </div>
  );
};
