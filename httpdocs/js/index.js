import Translator from 'https://app.directdemocracy.vote/app/js/translator.js';

document.addEventListener('DOMContentLoaded', () => {
  const faq = document.getElementById('faq');
  for (let i = 1; i <= 17; i++) { // generate FAQ
    const columns = document.createElement('div');
    faq.appendChild(columns);
    columns.classList.add('columns');
    const column = document.createElement('div');
    columns.appendChild(column);
    column.classList.add('column');
    const card = document.createElement('div');
    column.appendChild(card);
    card.classList.add('card');
    const a = document.createElement('a');
    card.appendChild(a);
    a.classList.add('anchor');
    a.setAttribute('id', 'q' + (i + 1));
    const header = document.createElement('header');
    card.appendChild(header);
    header.classList.add('card-header', 'has-background-grey');
    const p = document.createElement('p');
    header.appendChild(p);
    p.classList.add('card-header-title', 'has-text-white');
    p.innerHTML = `<span class="has-text-black mr-3"><span data-i18n="q"></span>${i}</span><span data-i18n="q${i}"></span>`;
    const content = document.createElement('div');
    card.appendChild(content);
    content.classList.add('card-content', 'has-background-white-ter', 'content');
    content.setAttribute('data-i18n', `a${i}`);
  }
  window.addEventListener('popstate', function(event) {
    loadPage();
    document.getElementById('navbar-menu').classList.remove('is-active');
    document.getElementById('navbar-burger').classList.remove('is-active');
  });
  document.getElementById('faq-menu').addEventListener('click', function(event) {
    event.currentTarget.blur();
  });
  function loadPage() {
    if (window.location.hash === '#faq' || window.location.hash.startsWith('#q')) {
      document.getElementById('main-page').classList.add('is-hidden');
      document.getElementById('faq-page').classList.remove('is-hidden');
      if (window.location.hash === '#faq')
        window.scrollTo(0, 0);
      else
        document.getElementById(window.location.hash.substring(1)).scrollIntoView();
    } else {
      document.getElementById('main-page').classList.remove('is-hidden');
      document.getElementById('faq-page').classList.add('is-hidden');
      if (window.location.hash)
        document.getElementById(window.location.hash.substring(1)).scrollIntoView();
    }
  }
  loadPage();
  let flags = null;
  let translator = new Translator('i18n');
  window.translator = translator;
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
          document.getElementById('language').innerHTML = '<img src="/images/flags/' + flags[language] + '.svg" width="24">';
        }
        flags = content;
        for (const [country, flag] of Object.entries(flags)) {
          let a = document.createElement('a');
          a.classList.add('navbar-item');
          a.setAttribute('id', `language-${country}`);
          a.addEventListener('click', function(event) {
            setLanguage(country);
            document.getElementById('navbar-menu').classList.remove('is-active');
            document.getElementById('navbar-burger').classList.remove('is-active');
          });
          let img = document.createElement('img');
          img.src = '/images/flags/' + flag + '.svg';
          img.width = '24';
          img.style.marginRight = '6px';
          a.appendChild(img);
          a.appendChild(document.createTextNode(translator.languages[country]));
          dropdown.appendChild(a);
        }
        setLanguage(translator.language);
        if (location.hash) {
          let requested_hash = location.hash.slice(1);
          location.hash = '';
          location.hash = requested_hash;
        }
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
  document.getElementById('main-menu').addEventListener('click', function() {
    history.replaceState({}, document.title, window.location.href.split('#')[0]);
    loadPage();
    window.scrollTo(0, 0);
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
