import Translator from 'https://app.directdemocracy.vote/app/js/translator.js';

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#faq' || window.location.hash.startsWith('#q')) {
    document.getElementById('main-page').classList.add('is-hidden');
    document.getElementById('faq-page').classList.remove('is-hidden');
  }
  let flags = null;
  let translator = new Translator('i18n');
  translator.onready = function() {
    const language = document.getElementById('language');
    const dropdown = document.getElementById('language-dropdown');
    fetch('../i18n/flags.json')
      .then((r) => r.json())
      .then((content) => {
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
          document.getElementById(`language-${previous}`).classList.remove('is-disabled');
          document.getElementById(`language-${language}`).classList.add('is-disabled');
          document.getElementById('language').innerHTML = flags[language];
        }
        flags = content;
        let first = true;
        for (const [country, flag] of Object.entries(flags)) {
          let a = document.createElement('a');
          a.classList.add('navbar-item');
          if (first) {
            a.classList.add('is-disabled');
            language.textContent = flag;
            first = false;
          }
          a.setAttribute('id', `language-${country}`);
          a.addEventListener('click', function(event) {
            setLanguage(country);
          });
          let span = document.createElement('span');
          span.classList.add('is-size-4', 'pr-2');
          span.textContent = flag;
          a.appendChild(span);
          a.appendChild(document.createTextNode(translator.languages[country]));
          dropdown.appendChild(a);
        }
        setLanguage(translator.language);
      })
      .catch((error) => {
        console.error('Could not load "i18n/flags.json".');
        console.error(error);
      });
  };
  const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  navbarBurgers.forEach(el => {
    el.addEventListener('click', () => {
      const target = document.getElementById(el.dataset.target);
      el.classList.toggle('is-active');
      target.classList.toggle('is-active');
    });
  });
  const navbarItems = document.querySelectorAll('.navbar-item');
  navbarItems.forEach(navbarItem => {
    navbarItem.addEventListener('click', function(event) {
      const t = event.currentTarget;
      document.getElementById('navbar-burger').classList.remove('is-active');
      document.getElementById('navbar-menu').classList.remove('is-active');
      if (t === document.getElementById('faq-menu')) {
        document.getElementById('main-page').classList.add('is-hidden');
        document.getElementById('faq-page').classList.remove('is-hidden');
        window.scrollTo(0, 0);
      } else if (
        t === document.getElementById('main-menu') ||
        t === document.getElementById('about-menu') ||
        t === document.getElementById('contact-menu') ||
        t === document.getElementById('donate-menu')) {
        document.getElementById('main-page').classList.remove('is-hidden');
        document.getElementById('faq-page').classList.add('is-hidden');
        if (t === document.getElementById('main-menu')) {
          history.pushState('', document.title, window.location.pathname + window.location.search);
          window.scrollTo(0, 0);
        }
      }
    });
  });
  function showPrivacy() {
    document.getElementById('privacy').classList.add('is-active');
  }
  function hidePrivacy() {
    document.getElementById('privacy').classList.remove('is-active');
  }
  document.getElementById('privacy-link').addEventListener('click', showPrivacy);
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape')
      hidePrivacy();
  });
  let closeOptions = document.querySelectorAll(
    '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button');
  closeOptions.forEach((close) => {
    close.addEventListener('click', () => {
      hidePrivacy();
    });
  });
});
