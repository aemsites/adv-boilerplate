import { loadBlock } from './adv.js';

(async function loadPostLCP() {
  const header = document.querySelector('header');
  if (header) await loadBlock(header);
}());
