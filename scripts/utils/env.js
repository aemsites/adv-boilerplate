const ENV = (() => {
  const { host } = window.location;
  if (!['.page', 'localhost'].some((check) => host.includes(check))) return 'prod';
  if (['.aem.'].some((check) => host.includes(check))) return 'stage';
  return 'dev';
})();

export default ENV;
