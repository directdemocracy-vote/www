import Translator from 'https://app.directdemocracy.vote/app/js/translator.js';

document.addEventListener('DOMContentLoaded', () => {
  let translator = new Translator('i18n');
  function setLanguage(language, previous) {
    if (previous === undefined) {
      previous = translator.language;
      const dd = document.getElementById('language-dropdown');
      dd.classList.add('is-hidden');
      setTimeout(() => {
        dd.classList.remove('is-hidden');
      }, 100);
    }
    translator.language = language;
    let flag;
    switch (language) {
      case 'en': flag = '🇺🇸'; break;
      case 'fr': flag = '🇫🇷'; break;
      default: flag = '?';
    }
    document.getElementById(`language-${previous}`).classList.remove('is-disabled');
    document.getElementById(`language-${language}`).classList.add('is-disabled');
    document.getElementById('language').innerHTML = flag;
  }
  translator.onready = function() {
    for (const [key] of Object.entries(translator.languages)) {
      document.getElementById(`language-${key}`).addEventListener('click', function(event) {
        setLanguage(key);
      });
    }
    if (translator.language !== 'en') // default one
      setLanguage(translator.language, 'en');
  };
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  $navbarBurgers.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = document.getElementById(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });
});
