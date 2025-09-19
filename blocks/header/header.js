import { getConfig, getMetadata } from '../../scripts/adv.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();

const HEADER_PATH = '/fragments/nav/header';

async function decorateLink(section, pattern, name) {
  const link = section.querySelector(`[href*="${pattern}"]`);
  if (!link) return;

  const icon = link.querySelector('span.icon');
  const text = link.textContent;
  const btn = document.createElement('button');
  if (icon) btn.append(icon);
  if (text) {
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = text;
    btn.append(textSpan);
  }
  link.parentElement.replaceChild(btn, link);

  if (name === 'color') {
    btn.addEventListener('click', () => {
      const { body } = document;

      let currPref = localStorage.getItem('color-scheme');
      if (!currPref) {
        currPref = matchMedia('(prefers-color-scheme: dark)')
          .matches ? 'dark-scheme' : 'light-scheme';
      }

      const theme = currPref === 'dark-scheme'
        ? { add: 'light-scheme', remove: 'dark-scheme' }
        : { add: 'dark-scheme', remove: 'light-scheme' };

      body.classList.remove(theme.remove);
      body.classList.add(theme.add);
      localStorage.setItem('color-scheme', theme.add);
    });
  }
}

function decorateBrand(section) {
  section.classList.add('brand-section');
}

function decorateMainNav(section) {
  section.classList.add('main-nav-section');
}

async function decorateActions(section) {
  section.classList.add('actions-section');
  const color = decorateLink(section, '/tools/widgets/scheme', 'color');
  const discord = decorateLink(section, 'discord.com', 'discord');
  const github = decorateLink(section, 'github.com', 'github');
  await Promise.all([color, discord, github]);
}

async function decorateHeader(fragment) {
  const sections = fragment.querySelectorAll('.section');
  if (sections[0]) decorateBrand(sections[0]);
  if (sections[1]) decorateMainNav(sections[1]);
  if (sections[2]) decorateActions(sections[2]);

  // if (img) {
  //   const brand = img.closest('.section');
  //   decorateBrand(brand);
  // }

  // const ul = fragment.querySelector('ul');
  // if (ul) {
  //   const mainNav = ul.closest('.section');
  //   decorateMainNav(mainNav);
  // }

  // const actions = fragment.querySelector('.section:last-child');

  // // Only decorate the action area if it has not been decorated
  // if (actions?.classList.length < 2) await decorateActions(actions);
}

/**
 * loads and decorates the header
 * @param {Element} el The header element
 */
export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('header-content');
    await decorateHeader(fragment);
    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
