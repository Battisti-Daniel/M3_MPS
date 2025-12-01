'use client';

import { useEffect, useState } from 'react';
import { FieldValues, UseFormReturn, Path, get } from 'react-hook-form';

export function useFormValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
) {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  const value = form.watch(fieldName);
  const error = get(form.formState.errors, fieldName);
  const isDirty = get(form.formState.dirtyFields, fieldName);

  useEffect(() => {
    if (!isDirty || !value) {
      setIsValid(null);
      setIsValidating(false);
      return;
    }

    // Simula validação em tempo real
    setIsValidating(true);
    const timer = setTimeout(() => {
      setIsValidating(false);
      setIsValid(!error);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, error, isDirty]);

  return {
    isValidating,
    isValid: isDirty ? isValid : null,
    hasError: !!error,
    isDirty: !!isDirty,
  };
}

