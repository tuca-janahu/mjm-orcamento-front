import type {
  AdditionalWebsiteModule, ApplicationType, ComplexityAdjustment, ContentManagementLevel,
  ContentResponsibility, DesignApproach, DomainService, HostingPlan, IntegrationComplexity,
  InternalSystemAuthenticationFeature, InternalSystemDataMigrationLevel,
  InternalSystemDocumentManagementLevel, InternalSystemNotificationChannel,
  InternalSystemPermissionModel, InternalSystemWorkflowLevel, MaintenancePlan, ProjectStatus,
  SeoLevel, WebPlatformAccountStructure, WebPlatformAuditLevel,
  WebPlatformAuthenticationFeature, WebPlatformBackofficeLevel, WebPlatformCategory,
  WebPlatformDataMigrationLevel, WebPlatformDesignApproach, WebPlatformFileHandlingLevel,
  WebPlatformNotificationChannel, WebPlatformPaymentFeature, WebsiteCategory,
} from "./api-options";

export type { ApplicationType, ProjectStatus } from "./api-options";

export type BudgetStatus = "RASCUNHO" | "FINALIZADO" | "ENVIADO" | "APROVADO" | "RECUSADO" | "CANCELADO";
export type UserInvitationStatus = "SENDING" | "PENDING" | "ACCEPTED" | "EXPIRED" | "DELIVERY_FAILED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
}

export interface LoginInput { email: string; password: string; }
export interface BudgetScopedItem { name: string; description?: string | undefined; complexity: IntegrationComplexity; }

export interface WebsiteBudgetInput {
  websiteCategory: WebsiteCategory;
  sectionCount: number;
  pageCount: number;
  uniqueLayoutCount: number;
  languageCount: number;
  contentResponsibility: ContentResponsibility;
  contentMigrationCount: number;
  designApproach: DesignApproach;
  contentManagement: ContentManagementLevel;
  simpleFormCount: number;
  advancedFormCount: number;
  integrations: BudgetScopedItem[];
  additionalModules: AdditionalWebsiteModule[];
  seoLevel: SeoLevel;
  domainService: DomainService;
  hostingPlan: HostingPlan;
  maintenancePlan: MaintenancePlan;
  isMvp?: boolean;
  targetLaunchDate?: string;
  complexityAdjustment: ComplexityAdjustment;
  complexityReason?: string;
  discountPercentage: number;
  discountReason?: string;
}

export interface WebPlatformBudgetInput {
  platformCategory: WebPlatformCategory;
  customCategoryDescription?: string;
  accountStructure: WebPlatformAccountStructure;
  screenCount: number;
  userRoleCount: number;
  languageCount: number;
  designApproach: WebPlatformDesignApproach;
  functionalModules: BudgetScopedItem[];
  adminBackoffice: WebPlatformBackofficeLevel;
  dashboardCount: number;
  reportCount: number;
  additionalAuthentication: WebPlatformAuthenticationFeature[];
  paymentFeatures: WebPlatformPaymentFeature[];
  notificationChannels: WebPlatformNotificationChannel[];
  fileHandling: WebPlatformFileHandlingLevel;
  auditLevel: WebPlatformAuditLevel;
  integrations: BudgetScopedItem[];
  dataMigration: WebPlatformDataMigrationLevel;
  dataMigrationSourceCount: number;
  hostingPlan: HostingPlan;
  maintenancePlan: MaintenancePlan;
  isMvp?: boolean;
  targetLaunchDate?: string;
  complexityAdjustment: ComplexityAdjustment;
  complexityReason?: string;
  discountPercentage: number;
  discountReason?: string;
}

export interface InternalSystemBudgetInput {
  modules: BudgetScopedItem[];
  accessProfileCount: number;
  targetLaunchDate?: string;
  permissionModel: InternalSystemPermissionModel;
  additionalAuthentication: InternalSystemAuthenticationFeature[];
  workflowLevel: InternalSystemWorkflowLevel;
  documentManagement: InternalSystemDocumentManagementLevel;
  dashboardCount: number;
  reportCount: number;
  additionalNotificationChannels: InternalSystemNotificationChannel[];
  integrations: BudgetScopedItem[];
  dataMigration: InternalSystemDataMigrationLevel;
  dataMigrationSourceCount: number;
  dataMigrationDescription?: string;
  hostingPlan: HostingPlan;
  maintenancePlan: MaintenancePlan;
  isMvp?: boolean;
  complexityAdjustment: ComplexityAdjustment;
  complexityReason?: string;
  discountPercentage: number;
  discountReason?: string;
}

export type BudgetInputData = WebsiteBudgetInput | WebPlatformBudgetInput | InternalSystemBudgetInput;
export interface BudgetFormValues<TInputData extends BudgetInputData> { inputData: TInputData; notes?: string; }

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface ProjectSummary {
  id: string;
  name: string;
  clientName: string | null;
  description: string | null;
  applicationType: ApplicationType;
  status: ProjectStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  responsibleUser: Pick<AuthUser, "id" | "name" | "email">;
  _count: { budgets: number };
}

export interface BudgetItemDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  recurring: boolean;
  displayOrder: number;
  metadata: JsonObject | null;
}

export interface BudgetDto<TInputData extends BudgetInputData = BudgetInputData> {
  id: string;
  projectId: string;
  versionNumber: number;
  status: BudgetStatus;
  inputData: TInputData;
  subtotal: string;
  complexityMultiplier: string;
  urgencyMultiplier: string;
  discountPercentage: string;
  mvpReductionPercentage: string;
  finalTotal: string;
  monthlyRecurringTotal: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: Pick<ProjectSummary, "id" | "name" | "applicationType">;
  createdBy: Pick<AuthUser, "id" | "name" | "email">;
  items: BudgetItemDto[];
}

export interface AuthenticatedOutletContext { user: AuthUser; }
export interface InternalUserDto extends AuthUser { createdAt: string; updatedAt: string; }
export interface UserInvitationDto {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: UserInvitationStatus;
  expiresAt: string;
  deliveryVersion: number;
  createdAt: string;
  updatedAt: string;
}
export type PricingConfigType = "FIXED_VALUE" | "UNIT_VALUE" | "MULTIPLIER" | "PERCENTAGE";
export interface PricingConfigDto {
  id: string;
  code: string;
  name: string;
  applicationType: ApplicationType;
  category: string;
  configType: PricingConfigType;
  value: string;
  active: boolean;
  metadata: JsonObject | null;
  createdAt: string;
  updatedAt: string;
}
