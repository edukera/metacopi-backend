import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isValidJson', async: false })
@Injectable()
export class IsValidJson implements ValidatorConstraintInterface {
  /**
   * Vérifie si la chaîne est un JSON valide
   * @param value La valeur à valider
   * @param args Les arguments de validation
   * @returns true si c'est un JSON valide, false sinon
   */
  validate(value: string, args: ValidationArguments): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      const json = JSON.parse(value);
      // Vérifier que le résultat est un objet ou un tableau
      return typeof json === 'object' && json !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Message d'erreur
   * @param args Arguments de validation
   * @returns Le message d'erreur
   */
  defaultMessage(args: ValidationArguments): string {
    return 'La valeur doit être un JSON valide';
  }
} 