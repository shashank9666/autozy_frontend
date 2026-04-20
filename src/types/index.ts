// ============================================================
// AUTOZY Admin Panel - TypeScript Types
// Generated from backend entity definitions
// ============================================================

// --- Enums ---

export enum StaffRole {
  DETAILER = 'DETAILER',
  INSPECTOR = 'INSPECTOR',
  SUPERVISOR = 'SUPERVISOR',
  SPECIALIST = 'SPECIALIST',
  CITY_MANAGER = 'CITY_MANAGER',
  ADMIN = 'ADMIN',
}

export enum VehicleSizeCategory {
  SMALL = 'SMALL',
  SEDAN = 'SEDAN',
  LARGE = 'LARGE',
}

export enum AreaStatus {
  AVAILABLE = 'AVAILABLE',
  FULL = 'FULL',
  COMING_SOON = 'COMING_SOON',
}

export enum SubscriptionStatus {
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum SlotType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
}

export enum PlanName {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum InspectionStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  CLEANED = 'CLEANED',
  CNA = 'CNA',
  MISSED = 'MISSED',
}

export enum TicketType {
  MISSED_SERVICE = 'MISSED_SERVICE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  BILLING = 'BILLING',
  OTHER = 'OTHER',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum ResolutionType {
  SERVICE_EXTENSION = 'SERVICE_EXTENSION',
  REFUND = 'REFUND',
  REWORK = 'REWORK',
  NONE = 'NONE',
}

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  APPLE_IAP = 'APPLE_IAP',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum AddonBookingStatus {
  BOOKED = 'BOOKED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REWORK = 'REWORK',
}

export enum AuditStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  SERVICE_UPDATE = 'SERVICE_UPDATE',
  INSPECTION = 'INSPECTION',
  PAYMENT = 'PAYMENT',
  TICKET = 'TICKET',
  ADDON = 'ADDON',
  SYSTEM = 'SYSTEM',
}

export enum ActorType {
  USER = 'USER',
  STAFF = 'STAFF',
  SYSTEM = 'SYSTEM',
}

export enum RouteStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// --- Interfaces ---

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  is_active: boolean;
  device_id: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  vehicles?: Vehicle[];
  subscriptions?: Subscription[];
  tickets?: Ticket[];
  payments?: Payment[];
}

export interface Staff {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  role: StaffRole;
  city_id: string | null;
  area_id: string | null;
  is_active: boolean;
  device_id: string | null;
  certifications: { name: string; issued_at: string; expires_at: string }[] | null;
  max_daily_cars: number;
  daily_working_hours_limit: number;
  created_at: string;
  updated_at: string;
  city?: City;
  area?: Area;
}

export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_number: string;
  brand: string;
  model: string;
  size_category: VehicleSizeCategory;
  parking_location_lat: number | null;
  parking_location_lng: number | null;
  parking_notes: string | null;
  is_active: boolean;
  created_at: string;
  user?: User;
  active_subscription?: Subscription;
  service_records?: ServiceRecord[];
  inspections?: Inspection[];
}

export interface City {
  id: string;
  name: string;
  state: string;
  is_active: boolean;
  created_at: string;
  areas?: Area[];
}

export interface Area {
  id: string;
  city_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  status: AreaStatus;
  max_capacity: number;
  current_subscriptions: number;
  is_onboarding_paused: boolean;
  created_at: string;
  city?: City;
}

export interface SubscriptionPlan {
  id: string;
  name: PlanName;
  description: string | null;
  features: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  pricing_entries?: PlanPricing[];
}

export interface PlanPricing {
  id: string;
  plan_id: string;
  city_id: string;
  area_id: string | null;
  vehicle_size: VehicleSizeCategory;
  price_monthly: number;
  effective_from: string;
  effective_to: string | null;
  created_by: string | null;
  created_at: string;
  plan?: SubscriptionPlan;
  city?: City;
  area?: Area;
}

export interface Subscription {
  id: string;
  user_id: string;
  vehicle_id: string;
  plan_pricing_id: string;
  status: SubscriptionStatus;
  slot_type: SlotType;
  start_date: string;
  end_date: string;
  inspection_deadline: string | null;
  service_start_date: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  vehicle?: Vehicle;
  plan_pricing?: PlanPricing;
  service_records?: ServiceRecord[];
  payments?: Payment[];
}

export interface Inspection {
  id: string;
  subscription_id: string;
  inspector_id: string | null;
  vehicle_id: string;
  status: InspectionStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
  vehicle_size_override: string | null;
  override_reason: string | null;
  photos: { url: string; type: string; timestamp: string; lat: number; lng: number }[] | null;
  fraud_flags: { type: string; description: string; flagged_at: string }[] | null;
  created_at: string;
  subscription?: Subscription;
  inspector?: Staff;
  vehicle?: Vehicle;
}

export interface ServiceRecord {
  id: string;
  subscription_id: string;
  vehicle_id: string;
  detailer_id: string | null;
  service_date: string;
  status: ServiceStatus;
  photos: { url: string; timestamp: string; lat: number; lng: number }[] | null;
  gps_lat: number | null;
  gps_lng: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  subscription?: Subscription;
  vehicle?: Vehicle;
  detailer?: Staff;
}

export interface Ticket {
  id: string;
  user_id: string;
  subscription_id: string;
  vehicle_id: string;
  type: TicketType;
  status: TicketStatus;
  service_date: string;
  description: string;
  proof_photos: string[] | null;
  resolution_type: ResolutionType | null;
  resolution_days: number | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  auto_validated: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  subscription?: Subscription;
  vehicle?: Vehicle;
  resolver?: Staff;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  addon_booking_id: string | null;
  amount: number;
  currency: string;
  payment_gateway: PaymentGateway;
  gateway_payment_id: string | null;
  gateway_order_id: string | null;
  status: PaymentStatus;
  invoice_number: string | null;
  gst_amount: number | null;
  invoice_url: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
  created_at: string;
  user?: User;
  subscription?: Subscription;
}

export interface AddonService {
  id: string;
  name: string;
  description: string;
  vehicle_sizes: string[];
  estimated_duration_minutes: number;
  required_certification: string | null;
  required_equipment: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface AddonBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  addon_service_id: string;
  specialist_id: string | null;
  status: AddonBookingStatus;
  scheduled_date: string;
  scheduled_slot_start: string;
  scheduled_slot_end: string;
  before_photos: { url: string; timestamp: string; lat: number; lng: number }[] | null;
  mid_photos: { url: string; timestamp: string; lat: number; lng: number }[] | null;
  after_photos: { url: string; timestamp: string; lat: number; lng: number }[] | null;
  specialist_notes: string | null;
  customer_rating: number | null;
  customer_review: string | null;
  supervisor_audit_status: AuditStatus;
  supervisor_id: string | null;
  audit_notes: string | null;
  dispute_window_end: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  vehicle?: Vehicle;
  addon_service?: AddonService;
  specialist?: Staff;
  supervisor?: Staff;
}

export interface Notification {
  id: string;
  user_id: string | null;
  staff_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_type: ActorType;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DailyRoute {
  id: string;
  detailer_id: string;
  date: string;
  vehicle_ids: string[];
  status: RouteStatus;
  completed_count: number;
  total_count: number;
  created_at: string;
  detailer?: Staff;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}
