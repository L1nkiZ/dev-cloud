import { Headers, Response } from 'node-fetch';

export type ApiMockRoute = {
  method?: string;
  path: string | RegExp;
  status?: number;
  headers?: Record<string, string>;
  handler: (
    url: string,
    init?: RequestInit,
  ) => Promise<Response | unknown> | Response | unknown;
};

export type ApiMock = {
  install: () => void;
  restore: () => void;
  addRoute: (route: ApiMockRoute) => ApiMock;
  resetRoutes: () => void;
  get: (
    path: string | RegExp,
    handler: ApiMockRoute['handler'],
    options?: Omit<ApiMockRoute, 'method' | 'path' | 'handler'>,
  ) => ApiMock;
  post: (
    path: string | RegExp,
    handler: ApiMockRoute['handler'],
    options?: Omit<ApiMockRoute, 'method' | 'path' | 'handler'>,
  ) => ApiMock;
  put: (
    path: string | RegExp,
    handler: ApiMockRoute['handler'],
    options?: Omit<ApiMockRoute, 'method' | 'path' | 'handler'>,
  ) => ApiMock;
  delete: (
    path: string | RegExp,
    handler: ApiMockRoute['handler'],
    options?: Omit<ApiMockRoute, 'method' | 'path' | 'handler'>,
  ) => ApiMock;
};

const normalizeMethod = (method?: string) => (method || 'GET').toUpperCase();

const createJsonResponse = (
  body: unknown,
  status: number,
  headers?: Record<string, string>,
) => {
  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  });

  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
};

const matchesPath = (path: string | RegExp, url: string) => {
  if (typeof path === 'string') {
    return url === path;
  }
  return path.test(url);
};

export function createApiMock(initialRoutes: ApiMockRoute[] = []): ApiMock {
  const routes: ApiMockRoute[] = [...initialRoutes];
  let originalFetch: typeof global.fetch | undefined;

  const matchRoute = (url: string, method: string) =>
    routes.find(
      (route) =>
        normalizeMethod(route.method) === method && matchesPath(route.path, url),
    );

  const fetchMock = async (
    input: RequestInfo,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    const method = normalizeMethod(init?.method ?? (input instanceof Request ? input.method : 'GET'));
    const route = matchRoute(url, method);

    if (!route) {
      if (originalFetch) {
        return originalFetch(input, init);
      }
      throw new Error(`No mock route for ${method} ${url}`);
    }

    const result = await route.handler(url, init);
    if (result instanceof Response) {
      return result;
    }

    return createJsonResponse(result, route.status ?? 200, route.headers);
  };

  const api: ApiMock = {
    install() {
      if (!originalFetch) {
        originalFetch = global.fetch.bind(global);
      }
      global.fetch = fetchMock as unknown as typeof global.fetch;
      return api;
    },

    restore() {
      if (originalFetch) {
        global.fetch = originalFetch;
        originalFetch = undefined;
      }
      return api;
    },

    addRoute(route: ApiMockRoute) {
      routes.push(route);
      return api;
    },

    resetRoutes() {
      routes.length = 0;
      return api;
    },

    get(path, handler, options) {
      return api.addRoute({ method: 'GET', path, handler, ...options });
    },

    post(path, handler, options) {
      return api.addRoute({ method: 'POST', path, handler, ...options });
    },

    put(path, handler, options) {
      return api.addRoute({ method: 'PUT', path, handler, ...options });
    },

    delete(path, handler, options) {
      return api.addRoute({ method: 'DELETE', path, handler, ...options });
    },
  };

  return api;
}

export type TodoItem = {
  id: string;
  name: string;
  completed: boolean;
};

const createId = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export type ItemsApiMock = ApiMock & {
  resetState: () => void;
};

export function createItemsApiMock(initialItems: TodoItem[] = []): ItemsApiMock {
  const initialState = [...initialItems];
  let items: TodoItem[] = [...initialItems];
  const api = createApiMock();

  const itemIdFromUrl = (url: string) => url.split('/').pop() ?? '';

  const createItemResponse = (item: TodoItem) => ({ ...item });

  api.get('/api/items', () => items.map(createItemResponse));

  api.post('/api/items', async (_url, init) => {
    const bodyText = init?.body ? String(init.body) : '{}';
    const body = JSON.parse(bodyText) as { name?: string };
    const newItem: TodoItem = {
      id: createId(),
      name: body.name || 'New item',
      completed: false,
    };
    items = [...items, newItem];
    return createItemResponse(newItem);
  }, { status: 201 });

  api.put(/^\/api\/items\/.+$/, async (url, init) => {
    const id = itemIdFromUrl(url);
    const bodyText = init?.body ? String(init.body) : '{}';
    const body = JSON.parse(bodyText) as Partial<TodoItem>;
    items = items.map((item) =>
      item.id === id
        ? { ...item, ...body, id }
        : item,
    );
    const updatedItem = items.find((item) => item.id === id);
    if (!updatedItem) {
      return new Response(null, { status: 404 });
    }
    return createItemResponse(updatedItem);
  });

  api.delete(/^\/api\/items\/.+$/, (url) => {
    const id = itemIdFromUrl(url);
    items = items.filter((item) => item.id !== id);
    return new Response(null, { status: 204 });
  });

  return {
    ...api,
    resetState() {
      items = [...initialState];
      return api;
    },
  };
}
