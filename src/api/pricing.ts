import { getApiClient } from './client';
import type { Pricing } from '../models';

export async function getPricing(): Promise<Pricing> {
  const res = await getApiClient().get('/pricing');
  return res.data.pricing;
}
