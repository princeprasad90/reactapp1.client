import * as yup from 'yup';

export interface CommandConfig<T> {
  schema: yup.ObjectSchema<T>;
  api: (values: T) => Promise<any>;
  onSuccess?: (result: any) => void;
}

export function useFormCommand<T>(config: CommandConfig<T>) {
  return async (values: T) => {
    try {
      const validated = await config.schema.validate(values, {
        abortEarly: false,
      });
      const result = await config.api(validated);
      config.onSuccess?.(result);
      return { result };
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        return { errors: err.errors };
      }
      throw err;
    }
  };
}
