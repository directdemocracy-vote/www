"use strict"

class Translator {
  #url;
  #dictionary;
  #languages;
  constructor(url, language) {
    if (!url.endsWith('/'))
      url += '/';
    this.#url = url;
    fetch(`${url}languages.json`)
      .then((r) => r.json())
      .then((languages) => {
        this.#languages = languages;
        this.language = language;
      })
      .catch((error) => {
        console.error(`Could not load "${url}languages.json".`);
        console.error(error);
      });
  }
  set language(l) {
    console.log('l='+l);
    console.log(this.#languages);
    console.log(Object.keys(this.#languages));
    if (l === undefined)
      l = navigator.languages ? navigator.languages[0] : navigator.language;
    if (!Object.keys(this.#languages).includes(l))
      l = l.substr(0, 2);
    console.log(l);
    if (!Object.keys(this.#languages).includes(l))
      l = 'en';
    if (document.documentElement.lang !== l)
      document.documentElement.lang = l;
    fetch(`${this.#url}${l}.json`)
      .then((r) => r.json())
      .then((dictionary) => {
        this.#dictionary = dictionary;
        this.translatePage();
      })
      .catch(() => {
        console.error(`Could not load "${this.#url}${l}.json".`);
      });
  }
  get language() {
    return document.documentElement.lang;
  }
  get languages() {
    return this.#languages;
  }
  translatePage() {
    let elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.dataset.i18n;
      if (key in this.#dictionary)
        element.innerHTML = this.translate(key);
      else {
        console.error(`Missing translation for key "${key}" in language "${this.#language}".`);
        element.innerHTML = this.translate('en');
      }
    });
  }
  translate(key) {
    return this.#dictionary[key];
  }
}
export default Translator;
