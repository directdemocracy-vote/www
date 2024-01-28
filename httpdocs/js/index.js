import Translator from 'https://app.directdemocracy.vote/app/js/translator.js';

document.addEventListener('DOMContentLoaded', () => {
  let donors_page = 0;  // not loaded
  window.addEventListener('popstate', function(event) {
    loadPage();
    document.getElementById('navbar-menu').classList.remove('is-active');
  });
  document.getElementById('faq-menu').addEventListener('click', function(event) {
    event.currentTarget.blur();
  });
  function loadPage() {
    if (window.location.hash === '#faq' || window.location.hash.startsWith('#q')) {
      document.getElementById('main-page').classList.add('is-hidden');
      document.getElementById('faq-page').classList.remove('is-hidden');
      document.getElementById('donors-wall-page').classList.add('is-hidden');
      if (window.location.hash === '#faq')
        window.scrollTo(0, 0);
      else
        document.getElementById(window.location.hash.substring(1)).scrollIntoView();
    } else if (window.location.hash.startsWith('#donors')) {
      document.getElementById('main-page').classList.add('is-hidden');
      document.getElementById('faq-page').classList.add('is-hidden');
      document.getElementById('donors-wall-page').classList.remove('is-hidden');
      const page = (window.location.hash === '#donors') ? 1 : parseInt(window.location.hash.split('-')[1]);
      loadDonors(page);
    } else {
      document.getElementById('main-page').classList.remove('is-hidden');
      document.getElementById('donors-wall-page').classList.add('is-hidden');
      document.getElementById('faq-page').classList.add('is-hidden');
      if (window.location.hash)
        document.getElementById(window.location.hash.substring(1)).scrollIntoView();
    }
  }
  loadPage();
  let flags = null;
  let translator = new Translator('i18n');
  function getFlagEmoji(countryCode) {
    const codePoints = countryCode.toUpperCase().split('').map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }
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
  document.getElementById('donate-link').addEventListener('click', function() {
    document.getElementById('main-page').classList.remove('is-hidden');
    document.getElementById('faq-page').classList.add('is-hidden');
  });
  function loadDonors(page) {
    if (donors_page === page)
      return;
    donors_page = page;
    const body = document.getElementById('donors-table-body');
    body.replaceChildren();
    fetch(`/donors.php?page=${page}`)
      .then(response => response.json())
      .then(answer => {
        for(const payment of answer) {
          const tr = document.createElement('tr');
          body.appendChild(tr);
          let td = document.createElement('td');
          tr.appendChild(td);
          let name = payment.organization !== '' ? payment.organization : (payment.familyName === '' ? payment.givenNames : payment.givenNames + ' ' + payment.familyName);
          td.textContent = name;
          if (payment.organization !== '')
            td.style.fontStyle = 'italic';
          td = document.createElement('td');
          tr.appendChild(td);
          if (payment.amount != 0) {
            let amount = payment.currency + ' ' + payment.amount;
            if (payment.frequency === 'monthly')
              amount += ' / month';
            else if (payment.frequency === 'annually')
              amount += ' / year';
            td.textContent = amount;
          }
          td = document.createElement('td');
          tr.appendChild(td);
          td.textContent = payment.comment;
          td = document.createElement('td');
          tr.appendChild(td);
          td.textContent = payment.paid;    
          td = document.createElement('td');
          tr.appendChild(td);
          td.textContent = getFlagEmoji(payment.country);
          td.title = payment.country;
          td.style.fontStyle = 'normal';
          td.style.textAlign = 'center';
          td.style.padding = '0';
          td.style.fontSize = '160%';
        }
      });
  }
});
