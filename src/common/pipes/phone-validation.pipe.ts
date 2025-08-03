import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PhoneUtils } from '../utils/phone.utils';

@Injectable()
export class PhoneValidationPipe implements PipeTransform<string, string> {
    transform(value: string): string {
        const standardizedNumber = PhoneUtils.filterPhoneNumber(value);
        
        if (!standardizedNumber) {
            throw new BadRequestException('Invalid phone number format. Must be a valid Tanzanian number.');
        }

        return standardizedNumber;
    }
} 