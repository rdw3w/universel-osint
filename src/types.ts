export interface OSINTModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "inactive" | "maintenance";
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type BaseIntelligenceQuery = {
  target: string;
  options?: Record<string, any>;
};
