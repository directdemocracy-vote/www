"use strict"

class Translator {
  constructor(dictionary_url, language) {
    if (!dictionary_url.endsWith('/'))
      dictionary_url += '/';
    this.#dictionary_url = dictionary_url;
    fetch(`${dictionary_url}languages.json`)
      .then((r) => r.json())
      .then((languages) => {
        this.#languages = languages;
        this.language = language;
      })
      .catch(() => {
        console.error(`Could not load "${dictionary_url}languages.json".`);
      });
  }
  set language(language) {
    if (language === undefined)
      language = navigator.languages ? navigator.languages[0] : navigator.language;
    if (!Object.keys(this.#languages).includes(language))
      language = language.substr(0, 2);
    if (!Object.keys(this.#languages).includes(language))
      language = 'en';
    if (document.documentElement.lang !== language)
      document.documentElement.lang = language;
    fetch(`${this.#dictionary_url}${language}.json`)
      .then((r) => r.json())
      .then((dictionary) => {
        this.#dictionary = dictionary;
        this.translatePage();
      })
      .catch(() => {
        console.error(`Could not load "${this.#dictionary_url}${language}.json".`);
      });
  }
  get language() {
    return document.documentElement.lang;
  }
  get languages() {
    return this.#languages;
  }
  translatePage() {
    this._elements = document.querySelectorAll("[data-i18n]");
    this._elements.forEach((element) => {
      let key = element.dataset.i18n;
      if (key in this.#dictionary)
        element.innerHTML = this.translate(key);
      else {
        console.error(`Missing translation for key "${key}" in language "${this.language}".`);
        element.innerHTML = this.translate('en');
      }
    });
  }
  translate(key) {
    return this.#dictionary[key];
  }
}
export default Translator;
