/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const getExtension = (path) => {
  const basename = path.split('/').pop();
  const pos = basename.lastIndexOf('.');
  return (basename === '' || pos < 1) ? '' : basename.slice(pos + 1);
};

const isMediaRequest = (url) => /\/media_[0-9a-f]{40,}[/a-zA-Z0-9_-]*\.[0-9a-z]+$/.test(url.pathname);
const isRUMRequest = (url) => /\/\.(rum|optel)\/.*/.test(url.pathname);

const getDraft = (url) => {
  if (!url.pathname.startsWith('/drafts/')) return null;
  return new Response('Not Found', { status: 404 });
};

const getPortRedirect = (request, url) => {
  if (url.port && url.hostname !== 'localhost') {
    const redirectTo = new URL(request.url);
    redirectTo.port = '';
    return new Response(`Moved permanently to ${redirectTo.href}`, {
      status: 301,
      headers: { location: redirectTo.href },
    });
  }
  return null;
};

const getRedirect = (resp, savedSearch) => {
  if (!(resp.status === 301 && savedSearch)) return;
  const location = resp.headers.get('location');
  if (location && !location.match(/\?.*$/)) {
    resp.headers.set('location', `${location}${savedSearch}`);
  }
};

const getRUMRequest = (request, url) => {
  if (!isRUMRequest(url)) return null;
  if (['GET', 'POST', 'OPTIONS'].includes(request.method)) return null;
  return new Response('Method Not Allowed', { status: 405 });
};

const formatSearchParams = (url) => {
  // remember original search params
  const { search: savedSearch, searchParams } = url;

  if (isMediaRequest(url)) {
    for (const [key] of searchParams.entries()) {
      if (!['format', 'height', 'optimize', 'width'].includes(key)) searchParams.delete(key);
    }
  } else if (getExtension(url.pathname) === 'json') {
    for (const [key] of searchParams.entries()) {
      if (!['limit', 'offset', 'sheet'].includes(key)) searchParams.delete(key);
    }
  } else {
    url.search = '';
  }
  searchParams.sort();
  return savedSearch;
};

const formatRequest = (env, url) => {
  url.hostname = env.AEM_HOSTNAME;
  url.port = '';
  url.protocol = 'https:';
  const req = new Request(url);
  req.headers.set('x-forwarded-host', req.headers.get('host'));
  req.headers.set('x-byo-cdn-type', 'cloudflare');
  if (env.PUSH_INVALIDATION !== 'disabled') {
    req.headers.set('x-push-invalidation', 'enabled');
  }
  if (env.ORIGIN_AUTHENTICATION) {
    req.headers.set('authorization', `token ${env.ORIGIN_AUTHENTICATION}`);
  }
  return req;
};

const getResp = async (req, savedSearch) => {
  let resp = await fetch(req, { method: req.method, cf: { cacheEverything: true } });
  resp = new Response(resp.body, resp);

  // Handle redirects with
  const redirectResp = getRedirect(resp, savedSearch);
  if (redirectResp) return redirectResp;

  if (resp.status === 304) {
    // 304 Not Modified - remove CSP header
    resp.headers.delete('Content-Security-Policy');
  }
  resp.headers.delete('age');
  resp.headers.delete('x-robots-tag');

  return resp;
};

const handleRequest = async (request, env) => {
  const url = new URL(request.url);

  const draftResp = getDraft(url);
  if (draftResp) return draftResp;

  const portResp = getPortRedirect(request, url);
  if (portResp) return portResp;

  const rumResp = getRUMRequest(request, url);
  if (rumResp) return rumResp;

  const savedSearch = formatSearchParams(url);

  const req = formatRequest(env, url);

  const resp = await getResp(req, savedSearch);
  return resp;
};

export default { fetch: handleRequest };
