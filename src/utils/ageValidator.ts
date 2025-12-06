import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function MinAge(minAge: number, validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'MinAge',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minAge],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Если значение пустое, пусть валидатор @IsDate обрабатывает это

          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          return age >= minAge;
        },
        defaultMessage(args: ValidationArguments) {
          const minAge = args.constraints[0];
          return `${propertyName} must be at least ${minAge} years ago`;
        }
      }
    });
  };
}