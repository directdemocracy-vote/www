"use strict"

class Translator {
  #url;
  #dictionary;
  #languages;
  #language;
  constructor(url, language) {
    if (!url.endsWith('/'))
      url += '/';
    this.#url = url;
    fetch(`${url}languages.json`)
      .then((r) => r.json())
      .then((languages) => {
        this.#languages = languages;
        this.language2 = language;
      })
      .catch((error) => {
        console.error(`Could not load "${url}languages.json".`);
        console.error(error);
      });
  }
  set language2(l) {
    console.log('l='+l);
    console.log(this.#languages);
    console.log(Object.keys(this.#languages));
    if (l === undefined)
      this.#language = navigator.languages ? navigator.languages[0] : navigator.language;
    if (!Object.keys(this.#languages).includes(l))
      this.#language = l.substr(0, 2);
    if (!Object.keys(this.#languages).includes(l))
      this.#language = 'en';
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
  get language2() {
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
