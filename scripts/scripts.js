import { loadArea, setConfig } from './adv.js';

// Supported locales
const locales = {
  '': { ietf: 'en' },
  '/de': { ietf: 'de' },
  '/zh': { ietf: 'zh' },
};

// Widget patterns to look for
const widgets = [
  { fragment: '/fragments/' },
  { youtube: 'https://www.youtube' },
];

// How to decorate an area before loading it
const decorateArea = ({ area = document }) => {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    img?.removeAttribute('loading');
  };

  eagerLoad(area, 'img');
};

(async function loadPage() {
  setConfig({ locales, widgets, decorateArea });
  await loadArea();
}());
