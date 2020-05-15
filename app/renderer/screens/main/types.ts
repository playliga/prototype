export interface RouteConfig {
  id: string;
  path: string;
  title: string;
  component?: any;
  icon?: any;
  subroutes?: RouteConfig[];
  notifications?: number;
}
