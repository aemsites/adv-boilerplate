import { loadArea } from '../../scripts/adv.js';

function replaceDotMedia(path, doc) {
  const resetAttributeBase = (tag, attr) => {
    doc.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
      el[attr] = new URL(el.getAttribute(attr), new URL(path, window.location)).href;
    });
  };
  resetAttributeBase('img', 'src');
  resetAttributeBase('source', 'srcset');
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  const resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) throw Error(`Couldn't fetch ${path}.plain.html`);

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Make embeded images cacheable
  replaceDotMedia(path, doc);

  const sections = doc.body.querySelectorAll(':scope > div');
  const fragment = document.createElement('div');
  fragment.classList.add('fragment-content');
  fragment.append(...sections);

  await loadArea({ area: fragment });

  return fragment;
}

export default async function init(a) {
  const path = a.getAttribute('href');
  const fragment = await loadFragment(path);
  if (fragment) {
    const defElToReplace = a.closest('main > .section > .default-content > *') || a;

    const sections = fragment.querySelectorAll(':scope > .section');
    const content = sections.length > 1 ? fragment : fragment.querySelector('.section-content');

    defElToReplace.parentElement.replaceChild(content, defElToReplace);
  }
}
