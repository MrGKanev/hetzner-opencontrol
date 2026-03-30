import { getApiClient } from './client';
import type { SSHKey } from '../models';

export async function getSshKeys(): Promise<SSHKey[]> {
  const all: SSHKey[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get('/ssh_keys', { params: { page, per_page: 50 } });
    all.push(...res.data.ssh_keys);
    if (!res.data.meta.pagination.next_page) break;
    page++;
  }
  return all;
}

export async function createSshKey(name: string, publicKey: string): Promise<SSHKey> {
  const res = await getApiClient().post('/ssh_keys', { name, public_key: publicKey });
  return res.data.ssh_key;
}

export async function deleteSshKey(id: number): Promise<void> {
  await getApiClient().delete(`/ssh_keys/${id}`);
}

export async function updateSshKey(id: number, name: string): Promise<SSHKey> {
  const res = await getApiClient().put(`/ssh_keys/${id}`, { name });
  return res.data.ssh_key;
}
