import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  email: text("email").unique(),
  phone: text("phone"),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  status: text("status").notNull().default("active"),
  isPremium: boolean("is_premium").notNull().default(false),
  totalUsageCount: integer("total_usage_count").notNull().default(0),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  successfulInvites: integer("successful_invites").default(0),
  referralRewardLevel: integer("referral_reward_level").default(0),
  referralConfirmed: boolean("referral_confirmed").default(false),
  bonusUsageLimit: integer("bonus_usage_limit").default(0),
  premiumExpiryDate: timestamp("premium_expiry_date"),
  passwordHash: text("password_hash"),
  lastLoginAt: timestamp("last_login_at"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  whatsappNumber: text("whatsapp_number"),
  leadScore: integer("lead_score").default(0),
  leadStatus: text("lead_status").default("new"),
  assignedAgentId: integer("assigned_agent_id"),
  toolsViewed: text("tools_viewed"),
  toolsUsedList: text("tools_used_list"),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

// ─── Admins ───────────────────────────────────────────────────────────────────

export const adminsTable = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Admin = typeof adminsTable.$inferSelect;
export type InsertAdmin = typeof adminsTable.$inferInsert;

// ─── Payment Settings ─────────────────────────────────────────────────────────

export const paymentSettingsTable = pgTable("payment_settings", {
  id: integer("id").primaryKey().default(1),
  price: integer("price").notNull().default(1500000),
  isPaystackEnabled: boolean("is_paystack_enabled").notNull().default(true),
  isManualEnabled: boolean("is_manual_enabled").notNull().default(true),
  paystackPublicKey: text("paystack_public_key"),
  paystackSecretKey: text("paystack_secret_key"),
  bankName: text("bank_name").notNull().default("Opay"),
  accountNumber: text("account_number").notNull().default("1234567890"),
  accountName: text("account_name").notNull().default("OneTailor Technologies"),
  instructions: text("instructions").notNull().default("Pay into the account above and send proof of payment to support."),
  paymentLink: text("payment_link"),
  globalUsageLimit: integer("global_usage_limit").notNull().default(25),
  currencyCode: text("currency_code").notNull().default("NGN"),
  currencySymbol: text("currency_symbol").notNull().default("₦"),
  measurementLimit: integer("measurement_limit").notNull().default(25),
  proUpgradeMessage: text("pro_upgrade_message").notNull().default("Unlock Premium to access all features."),
  proUpgradeLink: text("pro_upgrade_link"),
  proUpgradeButtonText: text("pro_upgrade_button_text").notNull().default("Unlock Premium"),
  proUpgradeTitle: text("pro_upgrade_title"),
  pendingTitle: text("pending_title"),
  pendingBody: text("pending_body"),
  pendingCta: text("pending_cta"),
  premiumUserTitle: text("premium_user_title"),
  premiumUserMessage: text("premium_user_message"),
  freeUpgradeTitle: text("free_upgrade_title"),
  freeUpgradeMessage: text("free_upgrade_message"),
  freeUpgradeCta: text("free_upgrade_cta"),
  price2Device: integer("price_2_device"),
  price3Device: integer("price_3_device"),
  price5Device: integer("price_5_device"),
  isDebugMode: boolean("is_debug_mode").notNull().default(false),
  isUsageLimitEnabled: boolean("is_usage_limit_enabled").notNull().default(true),
  pwaName: text("pwa_name"),
  pwaShortName: text("pwa_short_name"),
  pwaDescription: text("pwa_description"),
  pwaThemeColor: text("pwa_theme_color"),
  pwaBackgroundColor: text("pwa_background_color"),
  pwaLogoData: text("pwa_logo_data"),
  pwaFaviconData: text("pwa_favicon_data"),
  pwaSplashData: text("pwa_splash_data"),
  callmebotPhone: text("callmebot_phone"),
  callmebotApiKey: text("callmebot_api_key"),
  adminNotificationPhone: text("admin_notification_phone"),
  adminNotificationMessage: text("admin_notification_message"),
  followup24hEnabled: boolean("followup_24h_enabled").notNull().default(true),
  followup48hEnabled: boolean("followup_48h_enabled").notNull().default(true),
  followup72hEnabled: boolean("followup_72h_enabled").notNull().default(false),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  emailFromName: text("email_from_name"),
  emailFromAddr: text("email_from_addr"),
  resendApiKey: text("resend_api_key"),
  isSmtpEnabled: boolean("is_smtp_enabled").notNull().default(true),
  isResendEnabled: boolean("is_resend_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentSettings = typeof paymentSettingsTable.$inferSelect;

// ─── Licenses ─────────────────────────────────────────────────────────────────

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  status: text("status").notNull().default("active"),
  customerName: text("customer_name"),
  businessName: text("business_name"),
  licenseType: text("license_type").notNull().default("one_tailor"),
  phone: text("phone"),
  email: text("email"),
  activationDate: timestamp("activation_date"),
  expiryDate: timestamp("expiry_date"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type License = typeof licensesTable.$inferSelect;
export type InsertLicense = typeof licensesTable.$inferInsert;

// ─── License Activations ─────────────────────────────────────────────────────

export const licenseActivationsTable = pgTable("license_activations", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull(),
  deviceId: text("device_id").notNull(),
  activatedAt: timestamp("activated_at").notNull().defaultNow(),
});

export type LicenseActivation = typeof licenseActivationsTable.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("NGN"),
  method: text("method").notNull(),
  status: text("status").notNull().default("pending"),
  reference: text("reference").unique(),
  evidenceUrl: text("evidence_url"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;

// ─── Premium Requests ─────────────────────────────────────────────────────────

export const premiumRequestsTable = pgTable("premium_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  licenseType: text("license_type").notNull().default("one_tailor"),
  status: text("status").notNull().default("pending"),
  paymentId: integer("payment_id"),
  licenseId: integer("license_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PremiumRequest = typeof premiumRequestsTable.$inferSelect;

// ─── Business Profiles ────────────────────────────────────────────────────────

export const businessProfilesTable = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  landmark: text("landmark"),
  country: text("country").default("Nigeria"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BusinessProfile = typeof businessProfilesTable.$inferSelect;

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  deviceId: text("device_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: text("type").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;

// ─── Email Logs ───────────────────────────────────────────────────────────────

export const emailLogsTable = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  template: text("template").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export type EmailLog = typeof emailLogsTable.$inferSelect;

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;

// ─── Login Audit Logs ─────────────────────────────────────────────────────────

export const loginAuditLogsTable = pgTable("login_audit_logs", {
  id: serial("id").primaryKey(),
  actorType: text("actor_type").notNull().default("admin"),
  username: text("username").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull().default(true),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LoginAuditLog = typeof loginAuditLogsTable.$inferSelect;

// ─── Tailoring Customers ──────────────────────────────────────────────────────

export const tailoringCustomersTable = pgTable("tailoring_customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  gender: text("gender"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TailoringCustomer = typeof tailoringCustomersTable.$inferSelect;
export type InsertTailoringCustomer = typeof tailoringCustomersTable.$inferInsert;

// ─── Tailoring Measurements ───────────────────────────────────────────────────

export const tailoringMeasurementsTable = pgTable("tailoring_measurements", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  values: text("values").notNull(),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TailoringMeasurement = typeof tailoringMeasurementsTable.$inferSelect;
export type InsertTailoringMeasurement = typeof tailoringMeasurementsTable.$inferInsert;

// ─── WhatsApp Templates ───────────────────────────────────────────────────────

export const whatsappTemplatesTable = pgTable("whatsapp_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WhatsappTemplate = typeof whatsappTemplatesTable.$inferSelect;

// ─── CRM: Follow-Up Agents ────────────────────────────────────────────────────

export const followUpAgentsTable = pgTable("follow_up_agents", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FollowUpAgent = typeof followUpAgentsTable.$inferSelect;

// ─── CRM: Lead Interactions ───────────────────────────────────────────────────

export const leadInteractionsTable = pgTable("lead_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  agentId: integer("agent_id"),
  agentType: text("agent_type").default("admin"),
  agentName: text("agent_name"),
  type: text("type").notNull().default("note"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LeadInteraction = typeof leadInteractionsTable.$inferSelect;

// ─── CRM: Follow-Up Tasks ─────────────────────────────────────────────────────

export const followUpTasksTable = pgTable("follow_up_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  agentId: integer("agent_id"),
  taskType: text("task_type").notNull(),
  status: text("status").notNull().default("pending"),
  triggerAt: timestamp("trigger_at").notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FollowUpTask = typeof followUpTasksTable.$inferSelect;

// ─── Tailor Notes ─────────────────────────────────────────────────────────────

export const tailorNotesTable = pgTable("tailor_notes", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  customerId: integer("customer_id"),
  tags: text("tags"),
  isPinned: boolean("is_pinned").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  imageData: text("image_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TailorNote = typeof tailorNotesTable.$inferSelect;
export type InsertTailorNote = typeof tailorNotesTable.$inferInsert;
