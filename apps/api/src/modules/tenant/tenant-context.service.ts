import { Injectable } from '@nestjs/common';
import { resolveTenantContext, type TenantContextInput } from '@tep/shared';

@Injectable()
export class TenantContextService {
  resolve(input: TenantContextInput) {
    return resolveTenantContext(input);
  }
}
