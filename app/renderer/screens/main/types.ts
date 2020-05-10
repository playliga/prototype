export interface RouteConfig {
  key: string;
  path: string;
  title: string;
  component: any;
  icon?: any;
  subroutes?: RouteConfig[];
}
