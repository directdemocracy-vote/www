import Translator from 'https://app.directdemocracy.vote/app/js/translator.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log(navigator.language);
  let translator = new Translator('i18n');
  translator.onready = function() {
    console.log(translator.language);
    console.log(translator.languages[translator.language]);
    for (const [key, value] of Object.entries(translator.languages)) {
      document.getElementById(`language-${key}`).addEventListener('click', function(event) {

      });
      console.log(key, value);
    }
    if (translator.language === 'en')
      return; // default, already set
    let flag = '🇺🇸';
    switch (translator.language) {
      case 'fr': flag = '🇫🇷'; break;
      default: flag = '?';
    }
    document.getElementById('language-en').classList.remove('is-hidden');
    document.getElementById(`language-${translator.language}`).classList.add('is-hidden');
    document.getElementById('language').innerHTML = flag;
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
