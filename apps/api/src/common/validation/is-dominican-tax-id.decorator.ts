import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isValidDominicanTaxId } from './dominican-tax-id';

export function IsDominicanTaxId(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isDominicanTaxId',
      target: object.constructor,
      propertyName,
      options: {
        message: 'La cédula o el RNC no tiene un formato válido.',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isValidDominicanTaxId(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} debe ser una cédula de 11 dígitos o un RNC de 9 dígitos válido.`;
        },
      },
    });
  };
}
