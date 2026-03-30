// ─── Server ─────────────────────────────────────────────────────────────────

export type ServerStatus = 'running' | 'off' | 'stopping' | 'starting' | 'rebuilding' | 'migrating' | 'deleting' | 'unknown';

export interface ServerType {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
  architecture: 'x86' | 'arm';
  prices: Price[];
}

export interface Datacenter {
  id: number;
  name: string;
  description: string;
  location: Location;
}

export interface Location {
  id: number;
  name: string;
  description: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  network_zone: string;
}

export interface PublicNet {
  ipv4: { id: number; ip: string; blocked: boolean; dns_ptr: string } | null;
  ipv6: { id: number; ip: string; blocked: boolean; dns_ptr: DnsPtr[] } | null;
  floating_ips: number[];
  firewalls: Array<{ id: number; status: string }>;
}

export interface DnsPtr {
  ip: string;
  dns_ptr: string;
}

export interface Server {
  id: number;
  name: string;
  status: ServerStatus;
  created: string;
  server_type: ServerType;
  datacenter: Datacenter;
  image: Image | null;
  iso: Iso | null;
  rescue_enabled: boolean;
  locked: boolean;
  backup_window: string | null;
  outgoing_traffic: number | null;
  ingoing_traffic: number | null;
  included_traffic: number | null;
  public_net: PublicNet;
  labels: Record<string, string>;
  protection: { delete: boolean; rebuild: boolean };
  placement_group: PlacementGroup | null;
  primary_disk_size: number;
}

// ─── Image ──────────────────────────────────────────────────────────────────

export type ImageType = 'system' | 'snapshot' | 'backup' | 'app' | 'temporary';

export interface Image {
  id: number;
  type: ImageType;
  status: 'available' | 'creating' | 'unavailable';
  name: string | null;
  description: string;
  image_size: number | null;
  disk_size: number;
  created: string;
  created_from: { id: number; name: string } | null;
  bound_to: number | null;
  os_flavor: string;
  os_version: string | null;
  labels: Record<string, string>;
  protection: { delete: boolean };
}

// ─── ISO ────────────────────────────────────────────────────────────────────

export interface Iso {
  id: number;
  name: string | null;
  description: string;
  type: 'public' | 'private';
  architecture: 'x86' | 'arm' | null;
}

// ─── Volume ─────────────────────────────────────────────────────────────────

export interface Volume {
  id: number;
  name: string;
  server: number | null;
  location: Location;
  size: number;
  linux_device: string;
  status: 'available' | 'creating';
  created: string;
  labels: Record<string, string>;
  protection: { delete: boolean };
  format: string | null;
}

// ─── Floating IP ────────────────────────────────────────────────────────────

export interface FloatingIP {
  id: number;
  name: string;
  description: string;
  ip: string;
  type: 'ipv4' | 'ipv6';
  server: number | null;
  dns_ptr: DnsPtr[];
  home_location: Location;
  blocked: boolean;
  labels: Record<string, string>;
  protection: { delete: boolean };
  created: string;
}

// ─── Primary IP ─────────────────────────────────────────────────────────────

export interface PrimaryIP {
  id: number;
  name: string;
  ip: string;
  type: 'ipv4' | 'ipv6';
  assignee_id: number | null;
  assignee_type: 'server';
  auto_delete: boolean;
  blocked: boolean;
  datacenter: Datacenter;
  dns_ptr: DnsPtr[];
  labels: Record<string, string>;
  protection: { delete: boolean };
  created: string;
}

// ─── Firewall ───────────────────────────────────────────────────────────────

export type FirewallDirection = 'in' | 'out';
export type FirewallProtocol = 'tcp' | 'udp' | 'icmp' | 'esp' | 'gre';

export interface FirewallRule {
  direction: FirewallDirection;
  protocol: FirewallProtocol;
  port: string | null;
  source_ips: string[];
  destination_ips: string[];
  description: string | null;
}

export interface Firewall {
  id: number;
  name: string;
  rules: FirewallRule[];
  applied_to: Array<{ type: 'server' | 'label_selector'; server?: { id: number }; label_selector?: { selector: string } }>;
  labels: Record<string, string>;
  created: string;
}

// ─── Network ────────────────────────────────────────────────────────────────

export interface Subnet {
  type: 'cloud' | 'server' | 'vswitch';
  ip_range: string;
  network_zone: string;
  gateway: string;
  vswitch_id: number | null;
}

export interface Network {
  id: number;
  name: string;
  ip_range: string;
  subnets: Subnet[];
  servers: number[];
  load_balancers: number[];
  labels: Record<string, string>;
  protection: { delete: boolean };
  created: string;
}

// ─── Load Balancer ──────────────────────────────────────────────────────────

export interface LoadBalancer {
  id: number;
  name: string;
  public_net: { enabled: boolean; ipv4: { ip: string; dns_ptr: string }; ipv6: { ip: string; dns_ptr: string } };
  location: Location;
  load_balancer_type: { id: number; name: string; description: string };
  algorithm: { type: 'round_robin' | 'least_connections' };
  services: LoadBalancerService[];
  targets: LoadBalancerTarget[];
  labels: Record<string, string>;
  created: string;
  protection: { delete: boolean };
}

export interface LoadBalancerService {
  protocol: 'tcp' | 'http' | 'https';
  listen_port: number;
  destination_port: number;
  health_check: { protocol: string; port: number; interval: number; timeout: number; retries: number };
}

export interface LoadBalancerTarget {
  type: 'server' | 'label_selector' | 'ip';
  server?: { id: number };
  label_selector?: { selector: string };
  ip?: { ip: string };
}

// ─── Snapshot / Backup ──────────────────────────────────────────────────────

// Images with type 'snapshot' or 'backup' — reuses Image model

// ─── Placement Group ────────────────────────────────────────────────────────

export interface PlacementGroup {
  id: number;
  name: string;
  type: 'spread';
  servers: number[];
  labels: Record<string, string>;
  created: string;
}

// ─── SSH Key ─────────────────────────────────────────────────────────────────

export interface SSHKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  labels: Record<string, string>;
  created: string;
}

// ─── Certificate ─────────────────────────────────────────────────────────────

export interface Certificate {
  id: number;
  name: string;
  type: 'uploaded' | 'managed';
  domain_names: string[];
  fingerprint: string | null;
  not_valid_before: string | null;
  not_valid_after: string | null;
  labels: Record<string, string>;
  created: string;
}

// ─── Action ──────────────────────────────────────────────────────────────────

export interface Action {
  id: number;
  command: string;
  status: 'running' | 'success' | 'error';
  progress: number;
  started: string;
  finished: string | null;
  error: { code: string; message: string } | null;
  resources: Array<{ id: number; type: string }>;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface MetricTimeSeries {
  values: [number, string][];
}

export interface ServerMetrics {
  start: string;
  end: string;
  step: number;
  time_series: {
    'cpu'?: MetricTimeSeries;
    'disk.0.iops.read'?: MetricTimeSeries;
    'disk.0.iops.write'?: MetricTimeSeries;
    'disk.0.bandwidth.read'?: MetricTimeSeries;
    'disk.0.bandwidth.write'?: MetricTimeSeries;
    'network.0.pps.in'?: MetricTimeSeries;
    'network.0.pps.out'?: MetricTimeSeries;
    'network.0.bandwidth.in'?: MetricTimeSeries;
    'network.0.bandwidth.out'?: MetricTimeSeries;
  };
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface Price {
  location: string;
  price_hourly: { net: string; gross: string };
  price_monthly: { net: string; gross: string };
}

// ─── API Pagination ───────────────────────────────────────────────────────────

export interface Meta {
  pagination: {
    page: number;
    per_page: number;
    previous_page: number | null;
    next_page: number | null;
    last_page: number;
    total_entries: number;
  };
}

export interface ApiListResponse<T> {
  data: T[];
  meta: Meta;
}
