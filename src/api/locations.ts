import { getApiClient } from './client';
import type { Location, Datacenter } from '../models';

export async function getLocations(): Promise<Location[]> {
  const res = await getApiClient().get('/locations', { params: { per_page: 100 } });
  return res.data.locations;
}

export async function getDatacenters(): Promise<Datacenter[]> {
  const res = await getApiClient().get('/datacenters', { params: { per_page: 100 } });
  return res.data.datacenters;
}
