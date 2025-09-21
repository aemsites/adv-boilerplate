import toggleScheduler from '../scheduler/scheduler.js';

const getSk = () => document.querySelector('aem-sidekick');

async function ready(sk) {
  sk.addEventListener('custom:scheduler', toggleScheduler);
}

(async function loadSidekick() {
  const sk = getSk() || await new Promise((resolve) => {
    document.addEventListener('sidekick-ready', () => resolve(getSk()));
  });
  ready(sk);
}());
