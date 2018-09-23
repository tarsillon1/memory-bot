export function Static(target: { initialize: () => void }) {
  target.initialize();
}

export function Controller(base: string) {
  return (constructor: any) => {
    constructor.prototype._base = base;
  };
}

export enum Method {
  POST = "POST",
  GET = "GET"
}

export function Post(mapping: string) {
  return function(target: any, property: string) {
    if (!target._routes) target._routes = new Map();
    target._routes.set(property, {
      property,
      mapping,
      method: Method.POST,
      params: target._routes.get(property)
        ? target._routes.get(property).params
        : {}
    });
  };
}

export function Get(mapping: string) {
  return function(target: any, property: string) {
    if (!target._routes) target._routes = new Map();
    target._routes.set(property, {
      property,
      mapping,
      method: Method.GET,
      params: target._routes.get(property)
        ? target._routes.get(property).params
        : {}
    });
  };
}

export enum RouteParamType {
  Body = 0,
  Header = 1,
  Query = 2
}

export function BodyParam(key: string) {
  return (target: any, property: string, parameterIndex: number) => {
    if (!target._routes) target._routes = new Map();
    if (!target._routes.get(property))
      target._routes.set(property, { params: {} });

    target._routes.get(property).params[parameterIndex] = {
      type: RouteParamType.Body,
      key
    };
  };
}

export function HeaderParam(key: string) {
  return (target: any, property: string, parameterIndex: number) => {
    if (!target._routes) target._routes = new Map();
    if (!target._routes.get(property))
      target._routes.set(property, { params: {} });

    target._routes.get(property).params[parameterIndex] = {
      type: RouteParamType.Header,
      key
    };
  };
}

export function QueryParam(key: string) {
  return (target: any, property: string, parameterIndex: number) => {
    if (!target._routes) target._routes = new Map();
    if (!target._routes.get(property))
      target._routes.set(property, { params: {} });

    target._routes.get(property).params[parameterIndex] = {
      type: RouteParamType.Query,
      key
    };
  };
}
