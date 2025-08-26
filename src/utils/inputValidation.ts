/**
 * Input validation utilities for form fields
 */

// Input field types and their limits
export const INPUT_LIMITS = {
  // String fields - content, descriptions, names, etc.
  STRING_FIELD: 255,
  
  // ID fields - only user-inputtable IDs
  ID_FIELD: 40,
  
  // Number fields - numeric values
  NUMBER_FIELD: 100000
} as const;

// Input field type definitions
export type InputFieldType = 'string' | 'id' | 'number';

/**
 * Get character limit for input field type
 */
export const getInputLimit = (type: InputFieldType): number => {
  switch (type) {
    case 'string':
      return INPUT_LIMITS.STRING_FIELD;
    case 'id':
      return INPUT_LIMITS.ID_FIELD;
    case 'number':
      return INPUT_LIMITS.NUMBER_FIELD;
    default:
      return INPUT_LIMITS.STRING_FIELD;
  }
};

/**
 * Get character count display for text inputs
 */
export const getCharacterCountDisplay = (
  currentLength: number, 
  maxLength: number,
  warningThreshold: number = 0.8
): {
  text: string;
  className: string;
} => {
  const isWarning = currentLength > maxLength * warningThreshold;
  const isError = currentLength >= maxLength;
  
  let className = 'text-gray-500';
  if (isError) {
    className = 'text-red-600';
  } else if (isWarning) {
    className = 'text-orange-600';
  }
  
  return {
    text: `${currentLength}/${maxLength} ký tự`,
    className
  };
};

/**
 * Validate input value against limits
 */
export const validateInputLength = (
  value: string | number,
  type: InputFieldType
): {
  isValid: boolean;
  errorMessage?: string;
} => {
  const limit = getInputLimit(type);
  
  if (type === 'number') {
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        errorMessage: 'Giá trị phải là số'
      };
    }
    if (numValue > limit) {
      return {
        isValid: false,
        errorMessage: `Giá trị không được vượt quá ${limit.toLocaleString()}`
      };
    }
    if (numValue < 0) {
      return {
        isValid: false,
        errorMessage: 'Giá trị không được nhỏ hơn 0'
      };
    }
  } else {
    const strValue = String(value);
    if (strValue.length > limit) {
      return {
        isValid: false,
        errorMessage: `Không được vượt quá ${limit} ký tự`
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Common props for Input components with validation
 */
export const getInputValidationProps = (type: InputFieldType) => {
  const limit = getInputLimit(type);
  
  const baseProps = {
    maxLength: type !== 'number' ? limit : undefined,
    max: type === 'number' ? limit : undefined,
  };
  
  if (type === 'number') {
    return {
      ...baseProps,
      type: 'number',
      min: 0,
    };
  }
  
  return baseProps;
};

/**
 * Generate character counter component props
 */
export const getCharacterCounterProps = (
  value: string,
  type: InputFieldType,
  hasError: boolean = false
) => {
  if (type === 'number') return null;
  
  const limit = getInputLimit(type);
  const count = getCharacterCountDisplay(value.length, limit);
  
  return {
    show: true,
    text: count.text,
    className: hasError ? 'text-red-600' : count.className
  };
};
