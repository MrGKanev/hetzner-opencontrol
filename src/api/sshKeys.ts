import { getApiClient } from "./client";
import { fetchAllPages } from "./pagination";
import type { SSHKey } from "../models";

export async function getSshKeys(): Promise<SSHKey[]> {
  return fetchAllPages<SSHKey>("/ssh_keys", "ssh_keys");
}

export async function createSshKey(
  name: string,
  publicKey: string,
): Promise<SSHKey> {
  const res = await getApiClient().post("/ssh_keys", {
    name,
    public_key: publicKey,
  });
  return res.data.ssh_key;
}

export async function deleteSshKey(id: number): Promise<void> {
  await getApiClient().delete(`/ssh_keys/${id}`);
}

export async function updateSshKey(id: number, name: string): Promise<SSHKey> {
  const res = await getApiClient().put(`/ssh_keys/${id}`, { name });
  return res.data.ssh_key;
}
