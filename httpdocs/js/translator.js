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
        console.log(this.#languages);
        console.log(this.languages);
        this.language = language;
      })
      .catch((error) => {
        console.error(`Could not load "${url}language.json".`);
        console.error(error);
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
    fetch(`${this.#url}${language}.json`)
      .then((r) => r.json())
      .then((dictionary) => {
        this.#dictionary = dictionary;
        this.translatePage();
      })
      .catch((error) => {
        console.error(`Could not load "${this.#url}${language}.json".`);
        console.log(error);
      });
  }
  get language() {
    return document.documentElement.lang;
  }
  get languages() {
    console.log(this.#languages);
    return this.#languages;
  }
  translatePage() {
    let elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.dataset.i18n;
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
