import QrScanner from './qr-scanner.min.js';
QrScanner.WORKER_PATH = 'js/qr-scanner-worker.min.js';

let app = new Framework7({
  root: '#app',
  name: 'directdemocracy.vote',
  id: 'directdemocracy.vote',
  routes: [{
    path: '/info/',
    pageName: 'info'
  }, {
    path: '/',
    pageName: 'home'
  }]
});

let mainView = app.views.create('.view-main');

window.onload = function() {
  const DIRECTDEMOCRACY_VERSION = '0.0.1';
  let citizen = {
    schema: '',
    key: '',
    signature: '',
    published: 0,
    expires: 0,
    familyName: '',
    givenNames: '',
    picture: '',
    latitude: 0,
    longitude: 0
  };
  let area = '';
  let endorsements = [];
  let citizenEndorsements = [];
  let citizenCrypt = null;
  let citizenFingerprint = null;
  let endorseMessage = "Scan the QR code of another citizen's card to endorse her.";
  let endorseMap = null;
  let endorseMarker = null;
  let scanner = null;
  let endorsed = null;
  let referendums = [];
  let stationKey = '';
  let availableReferendum = 0;
  const VOTE_KEY_POOL_SIZE = 10;
  let voteKeyPool = JSON.parse(localStorage.getItem('voteKeyPool'));
  if (voteKeyPool === null)
    voteKeyPool = [];
  let votes = JSON.parse(localStorage.getItem('votes'));
  if (votes === null)
    votes = [];
  let registrations = JSON.parse(localStorage.getItem('registrations'));
  if (registrations === null)
    registrations = [];

  let publisher = localStorage.getItem('publisher');
  if (!publisher) {
    publisher = 'https://publisher.directdemocracy.vote';
    localStorage.setItem('publisher', publisher);
  }

  document.getElementById('endorse-message').innerHTML = endorseMessage;
  document.getElementById('publisher').value = publisher;
  document.getElementById('publisher').addEventListener('input', function(event) {
    localStorage.setItem('publisher', event.target.value);
  });
  let trustee = localStorage.getItem('trustee');
  if (!trustee) {
    trustee = 'https://trustee.directdemocracy.vote';
    localStorage.setItem('trustee', trustee);
  }
  document.getElementById('trustee').value = trustee;
  document.getElementById('trustee').addEventListener('input', function(event) {
    localStorage.setItem('trustee', event.target.value);
  });
  let station = localStorage.getItem('station');
  if (!station) {
    station = 'https://station.directdemocracy.vote';
    localStorage.setItem('station', station);
  }
  document.getElementById('station').value = station;
  updateStationKey();
  document.getElementById('station').addEventListener('input', function(event) {
    localStorage.setItem('station', event.target.value);
    station = event.target.value;
    updateStationKey();
  });

  document.getElementById('referendum-paste').addEventListener('click', function(event) {
    navigator.clipboard.readText().then(text => {
      let input = document.getElementById('referendum-reference');
      input.value = text;
      app.input.checkEmptyState(input);
      showReferendum(text);
    });
  });

  document.getElementById('referendum-reference').addEventListener('input', function(event) {
    showReferendum(event.target.value);
  });

  document.getElementById('referendum-scan').addEventListener('click', function(event) {
    const button = event.target;
    const video = document.getElementById('referendum-qr-video');
    const videoBlock = document.getElementById('referendum-qr-video-block');
    const scannedReferendum = document.getElementById('scanned-referendum');
    const scannedReferendumTitle = document.getElementById('scanned-referendum-title');
    const input = document.getElementById('referendum-reference');

    if (scanner) { // Cancel pressed
      button.classList.remove('color-red');
      button.classList.add('color-blue');
      videoBlock.style.display = 'none';
      scanner.destroy();
      scanner = null;
      return;
    }
    videoBlock.style.display = '';
    button.classList.remove('color-blue');
    button.classList.add('color-red');
    scanner = new QrScanner(video, fingerprint => setResult(fingerprint));
    scanner.start();

    function setResult(fingerprint) {
      input.value = fingerprint;
      app.input.checkEmptyState(input);
      videoBlock.style.display = 'none';
      button.classList.remove('color-red');
      button.classList.add('color-blue');
      scanner.destroy();
      scanner = null;
      showReferendum(fingerprint);
    }
  });

  function showReferendum(reference) {
    let value = reference.toLowerCase();
    if (value.length !== 40)
      return;
    const regexp = /^[0-9a-f]+$/;
    if (!regexp.test(value)) {
      app.dialog.alert('The reference format for a referendum is wrong, please double-check your input',
        'Wrong Referendum Reference');
      return;
    }
    let xhttp = new XMLHttpRequest();
    xhttp.open('POST', publisher + '/referendum.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('fingerprint=' + encodeURIComponent(value) + '&area=' + encodeURIComponent(area));
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        parent = document.getElementById('scanned-referendum');
        parent.innerHTML = '';
        if (answer.error)
          app.dialog.alert(answer.error, 'Referendum Not Found');
        else {
          console.log(answer);
          let state = {
            previousAreaName: '',
            previousAreaType: '',
            topUp: null
          };
          referendums.push(answer);
          addReferendum(parent, answer, availableReferendum, state, true);
        }
      }
    };
  }

  function updateStationKey() {
    if (station) {
      let xhttp = new XMLHttpRequest();
      xhttp.onload = function() {
        if (this.status == 200) {
          let answer = JSON.parse(this.responseText);
          if (answer.error)
            app.dialog.alert(answer.error, 'Station key');
          else {
            stationKey = answer.key;
            votes.forEach(function(vote, index) {
              updateVoteKey(index, vote);
            });
          }
        }
      };
      xhttp.open('POST', station + '/key.php', true);
      xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhttp.send();
    }
  }

  function createNewKey() {
    let dt = new Date();
    let time = -(dt.getTime());
    citizenCrypt = new JSEncrypt({
      default_key_size: 2048
    });
    citizenCrypt.getKey(function() {
      dt = new Date();
      time += (dt.getTime());
      privateKey = citizenCrypt.getPrivateKey();
      localStorage.setItem('privateKey', privateKey);
      privateKeyAvailable('forged in ' + Number(time / 1000).toFixed(2) + ' seconds.');
    });
  }

  let privateKey = localStorage.getItem('privateKey');
  if (privateKey) {
    citizenCrypt = new JSEncrypt();
    citizenCrypt.setPrivateKey(privateKey);
    privateKeyAvailable('complete.');
  } else createNewKey();
  const now = new Date();
  let ten = new Date();
  ten.setFullYear(ten.getFullYear() + 10);
  const inTenYears = ten.getFullYear() + '-' + String(ten.getMonth() + 1).padStart(2, '0') +
    '-' + String(ten.getDate()).padStart(2, '0');
  let date = document.getElementById('register-expiration');
  date.setAttribute('placeholder', inTenYears);
  date.value = inTenYears;
  let calendar = app.calendar.create({
    inputEl: '#register-expiration',
    dateFormat: 'yyyy-mm-dd',
    disabled: [{
      to: now
    }, {
      from: ten
    }]
  });

  const missingInVoteKeyPool = VOTE_KEY_POOL_SIZE - voteKeyPool.length;
  if (missingInVoteKeyPool)
    console.log("Generating " + missingInVoteKeyPool + " key(s) for votes");
  for (let i = 0; i < missingInVoteKeyPool; i++)
    createNewVoteKey();

  function createNewVoteKey() {
    let crypt = new JSEncrypt({
      default_key_size: 2048
    });
    crypt.getKey(function() {
      voteKeyPool.push(crypt.getPrivateKey());
      localStorage.setItem('voteKeyPool', JSON.stringify(voteKeyPool));
      votes.forEach(function(vote, index) {
        console.log("VoteKeyPool has " + voteKeyPool.length + " entries.");
        updateVoteKey(index, vote);
      });
    });
  }

  function publicKey(key) {
    let pkey = '-----BEGIN PUBLIC KEY-----\n';
    const l = key.length;
    for (let i = 0; i < l; i += 64)
      pkey += key.substr(i, 64) + '\n';
    pkey += '-----END PUBLIC KEY-----';
    return pkey;
  }

  function strippedKey(publicKey) {
    let stripped = '';
    const header = '-----BEGIN PUBLIC KEY-----\n'.length;
    const footer = '-----END PUBLIC KEY-----'.length;
    const l = publicKey.length - footer;
    for (let i = header; i < l; i += 65)
      stripped += publicKey.substr(i, 64);
    stripped = stripped.slice(0, -1 - footer);
    return stripped;
  }

  function privateKeyAvailable(message) {
    let progress = document.getElementById('register-progressbar');
    progress.classList.remove('progressbar-infinite');
    progress.classList.add('progressbar');
    progress.setAttribute('data-progress', '100');
    document.getElementById('register-button').innerHTML = 'Register';
    document.getElementById('registration-key-generation-status').innerHTML = message;
    validateRegistration();
  }

  function privateKeyNotAvailable() {
    let progress = document.getElementById('register-progressbar');
    progress.classList.add('progressbar-infinite');
    progress.classList.remove('progressbar');
    progress.removeAttribute('data-progress');
    document.getElementById('register-button').innerHTML = 'Generating cryptographic key...';
    document.getElementById('registration-key-generation-status').innerHTML = 'please wait...';
    validateRegistration();
  }

  function validateRegistration() {
    let button = document.getElementById('register-button');
    disable(button);
    if (document.getElementById('register-family-name').value.trim() == '')
      return;
    if (document.getElementById('register-given-names').value.trim() == '')
      return;
    if (document.getElementById('register-picture').src == 'images/default-picture.png')
      return;
    if (document.getElementById('register-location').value == '')
      return;
    if (!document.getElementById('register-confirm-check').checked)
      return;
    enable(button);
  }

  function uploadPicture() {
    document.getElementById('register-picture-upload').click();
  }

  function enable(item) {
    let i = (typeof item === 'string') ? document.getElementById(item) : item;
    i.classList.remove('disabled');
  }

  function disable(item) {
    let i = (typeof item === 'string') ? document.getElementById(item) : item;
    if (i.classList.contains('disabled'))
      return;
    i.classList.add('disabled');
  }

  document.getElementById('register-family-name').addEventListener('input', validateRegistration);
  document.getElementById(
    'register-given-names').addEventListener('input', validateRegistration);
  document.getElementById(
    'register-confirm-check').addEventListener('input', validateRegistration);
  document.getElementById(
    'register-upload-button').addEventListener('click', uploadPicture);
  document.getElementById('register-picture').addEventListener(
    'click', uploadPicture);
  document.getElementById('register-picture-upload').addEventListener('change', function(event) {
    let content = {};
    content.innerHTML =
      `<div class="sheet-modal" style="height: 100%">
  <div class="toolbar">
    <div class="toolbar-inner">
      <div class="left" style="margin-left:16px">Adjust your ID photo</div>
      <div class="right">
        <a href="#" class="link sheet-close">Done</a>
      </div>
    </div>
  </div>
  <div class="sheet-modal-inner">
    <div class="block margin-top-half no-padding-left no-padding-right">
      <p><img id="edit-picture"></p>
      <div class="row">
        <button class="col button" id="rotate-right"><i class="icon f7-icons">rotate_right_fill</i></button>
        <button class="col button" id="rotate-left"><i class="icon f7-icons">rotate_left_fill</i></button>
      </div>
    </div>
  </div>
</div>`;
    let croppie = null;
    let sheet = app.sheet.create({
      content: content.innerHTML,
      on: {
        opened: function() {
          let img = document.getElementById('edit-picture');
          img.src = URL.createObjectURL(event.target.files[0]);
          event.target.value = '';
          let w = screen.width * 0.95;
          croppie = new Croppie(img, {
            boundary: {
              width: w,
              height: w * 4 / 3
            },
            viewport: {
              width: w * 0.75,
              height: w * 0.75 * 4 / 3
            },
            enableOrientation: true,
            enableExif: true
          });
          document.getElementById('rotate-right').addEventListener('click', function() {
            croppie.rotate(-90);
          });
          document.getElementById('rotate-left').addEventListener('click', function() {
            croppie.rotate(90);
          });
        },
        close: function() {
          croppie.result({
            type: 'base64',
            size: {
              width: 150,
              height: 200
            },
            format: 'jpeg',
            quality: 0.95
          }).then(function(result) {
            document.getElementById('register-picture').setAttribute('src', result);
            citizen.picture = result;
            croppie.destroy();
            croppie = null;
            validateRegistration();
          });
        }
      }
    });
    sheet.open();
  });
  document.getElementById('register-location-button').addEventListener('click', function() {
    let content = {};
    content.innerHTML =
      `<div class="sheet-modal" style="height: 100%">
  <div class="toolbar">
    <div class="toolbar-inner">
      <div class="left" style="margin-left:16px">Select your home location</div>
      <div class="right">
        <a href="#" class="link sheet-close">Done</a>
      </div>
    </div>
  </div>
  <div class="sheet-modal-inner">
    <div class="block margin-top-half no-padding-left no-padding-right">
      <div class="text-align-center" style="width:100%"><small>Zoom to building level to precisely select your home address.</small></div>
      <div id="register-map" style="width:100%;height:500px;margin-top:10px"></div>
    </div>
  </div>
</div>`;
    let sheet = app.sheet.create({
      content: content.innerHTML,
      on: {
        opened: function() {
          let geolocation = false;

          function updateLocation() {
            registerMarker.setPopupContent(citizen.latitude + ', ' + citizen.longitude).openPopup();
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
              if (this.readyState == 4 && this.status == 200) {
                const a = JSON.parse(this.responseText);
                const address = a.display_name;
                registerMarker.setPopupContent(address + '<br><br><center style="color:#999">(' +
                  citizen.latitude + ', ' + citizen.longitude + ')</center>').openPopup();
              }
            };
            xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + citizen.latitude +
              '&lon=' +
              citizen.longitude + '&zoom=20', true);
            xhttp.send();
          }

          function getGeolocationPosition(position) {
            geolocation = true;
            citizen.latitude = roundGeo(position.coords.latitude);
            citizen.longitude = roundGeo(position.coords.longitude);
            registerMap.setView([citizen.latitude, citizen.longitude], 12);
            setTimeout(function() {
              registerMarker.setLatLng([citizen.latitude, citizen.longitude]);
              updateLocation();
            }, 500);
          }

          function roundGeo(v) {
            return Math.round(v * 1000000) / 1000000;
          }
          if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(getGeolocationPosition);
          let xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200 && geolocation == false) {
              coords = this.responseText.split(',');
              getGeolocationPosition({
                coords: {
                  latitude: coords[0],
                  longitude: coords[1]
                }
              });
            }
          };
          xhttp.open('GET', 'https://ipinfo.io/loc', true);
          xhttp.send();
          let registerMap = L.map('register-map').setView([citizen.latitude, citizen.longitude], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(registerMap);
          registerMap.whenReady(function() {
            setTimeout(() => {
              this.invalidateSize();
            }, 0);
          });
          let registerMarker = L.marker([citizen.latitude, citizen.longitude]).addTo(registerMap)
            .bindPopup(citizen.latitude + ',' + citizen.longitude);
          let e = document.getElementById('register-map');
          const rect = e.getBoundingClientRect();
          const h = screen.height - rect.top;
          e.style.height = h + 'px';
          updateLocation();
          registerMap.on('contextmenu', function(event) {
            return false;
          });
          registerMap.on('click', function onMapClick(e) {
            citizen.latitude = roundGeo(e.latlng.lat);
            citizen.longitude = roundGeo(e.latlng.lng);
            registerMarker.setLatLng([citizen.latitude, citizen.longitude]);
            updateLocation();
          });
        },
        close: function() {
          console.log('Sheet closing');
          document.getElementById('register-location').value = citizen.latitude + ', ' + citizen.longitude;
          validateRegistration();
        }
      }
    });
    sheet.open();
  });
  document.getElementById('register-button').addEventListener('click', function() {
    console.log("registering...");
    citizen.schema = 'https://directdemocracy.vote/json-schema/' + DIRECTDEMOCRACY_VERSION + '/citizen.schema.json';
    citizen.key = strippedKey(citizenCrypt.getPublicKey());
    citizen.published = new Date().getTime();
    citizen.expires = new Date(document.getElementById('register-expiration').value + 'T00:00:00Z').getTime();
    citizen.familyName = document.getElementById('register-family-name').value.trim();
    citizen.givenNames = document.getElementById('register-given-names').value.trim();
    citizen.signature = '';
    citizen.signature = citizenCrypt.sign(JSON.stringify(citizen), CryptoJS.SHA256, 'sha256');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          app.dialog.alert(answer.error + '.<br>Please try again.', 'Publication Error');
        else {
          updateCitizenCard();
          app.dialog.alert('Your citizen card was just published.', 'Congratulation!');
          window.localStorage.setItem('registered', true);
        }
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(citizen));
    return false;
  });
  if (window.localStorage.getItem('registered')) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          app.dialog.alert(answer.error + '.<br>Please try again.', 'Citizen Error');
        else {
          citizen = answer.citizen;
          citizen.key = strippedKey(citizenCrypt.getPublicKey());
          endorsements = answer.endorsements;
          if (endorsements.error)
            app.dialog.alert(endorsements.error, 'Citizen Endorsement Error');
          citizenEndorsements = answer.citizen_endorsements;
          updateCitizenCard();
          updateEndorsements();
          updateArea();
        }
      }
    };
    xhttp.open('POST', publisher + '/citizen.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('key=' + encodeURIComponent(strippedKey(citizenCrypt.getPublicKey())));
  } else {
    showPage('register');
  }

  function editCitizenCard(revoke) {
    showPage('register');
    if (revoke) {
      privateKeyNotAvailable();
      createNewKey();
    }
    document.getElementById('tab-card-title').innerHTML = 'Edit Citizen Card' + (revoke ?
      ' <small>(revoked key)</small>' :
      '');
    let button = document.getElementById('register-button');
    button.innerHTML = 'Publish';
    disable(button);
    document.getElementById('register-confirm-check').checked = false;
    app.tab.show('#tab-card', true);
  }

  function showPage(page) {
    const pages = ['splash', 'register', 'card'];
    if (!pages.includes(page))
      return;
    document.getElementById(page + '-page').style.display = '';
    pages.forEach(function(p) {
      if (p !== page)
        document.getElementById(p + '-page').style.display = 'none';
    });
    const cardItems = ['tabbar-endorse', 'tab-endorse', 'endorse', 'tabbar-vote', 'tab-vote', 'edit', 'revoke-key'];
    cardItems.forEach(function(i) {
      if (page === 'card')
        enable(i);
      else
        disable(i);
    });
  }

  function newElement(parent, type, classes, innerHTML) {
    let element = document.createElement(type);
    if (parent)
      parent.appendChild(element);
    if (classes) {
      const classArray = classes.split(' ');
      classArray.forEach(function(c) {
        element.classList.add(c);
      });
    }
    if (typeof innerHTML !== 'undefined')
      element.innerHTML = innerHTML;
    return element;
  }

  function updateCitizenCard() {
    showPage('card');
    document.getElementById('citizen-picture').setAttribute('src', citizen.picture);
    document.getElementById('register-picture').setAttribute('src', citizen.picture);
    document.getElementById('citizen-family-name').innerHTML = citizen.familyName;
    document.getElementById('register-family-name').value = citizen.familyName;
    document.getElementById('citizen-given-names').innerHTML = citizen.givenNames;
    document.getElementById('register-given-names').value = citizen.givenNames;
    document.getElementById('citizen-coords').innerHTML =
      '<a class="link external" target="_blank" href="https://openstreetmap.org/?mlat=' +
      citizen.latitude + '&mlon=' + citizen.longitude + '&zoom=12">' +
      citizen.latitude + ', ' + citizen.longitude + '</a>';
    document.getElementById('register-location').value = citizen.latitude + ', ' + citizen.longitude;
    let published = new Date(citizen.published);
    let expires = new Date(citizen.expires);
    document.getElementById('citizen-published').innerHTML = published.toISOString().slice(0, 10);
    document.getElementById('citizen-expires').innerHTML = expires.toISOString().slice(0, 10);
    citizenFingerprint = CryptoJS.SHA1(citizen.signature).toString();
    let qrImage = document.getElementById('citizen-qr-code');
    const rect = qrImage.getBoundingClientRect();
    const rect2 = document.getElementById('tabbar').getBoundingClientRect();
    const height = rect2.top - rect.top;
    const width = screen.width - 30;
    const size = width > height ? height : width;
    let qr = new QRious({
      element: qrImage,
      value: citizenFingerprint,
      level: 'M',
      size,
      padding: 0
    });
    // get reputation from trustee
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let reputation = document.getElementById('citizen-reputation');
        let answer = JSON.parse(this.responseText);
        let badge = document.getElementById('endorsed-badge');
        if (answer.error) {
          reputation.innerHTML = '<span style="font-weight:bold;color:red">' + answer.error + "</span>";
          badge.classList.remove('color-blue');
          badge.classList.add('color-red');
        } else {
          const color = answer.endorsed ? 'blue' : 'red';
          reputation.innerHTML = '<span style="font-weight:bold;color:' + color + '">' + answer.reputation +
            '</span>';
          badge.classList.remove('color-red');
          badge.classList.remove('color-blue');
          badge.classList.add('color-' + color);
        }
      }
    };
    xhttp.open('GET', trustee + '/reputation.php?key=' + encodeURIComponent(citizen.key), true);
    xhttp.send();
    let list = document.getElementById('citizen-endorsements-list');
    let badge = document.getElementById('endorsed-badge');
    if (citizenEndorsements.length == 0) {
      list.innerHTML =
        '<div class="block-title">Not endorsed</div>' +
        '<div class="block">You should ask to other citizens to endorse you.</div>';
      badge.style.background = 'red';
      badge.innerHTML = '0';
      return;
    }
    let revokeCount = 0;
    citizenEndorsements.forEach(function(endorsement) {
      if (endorsement.revoke)
        revokeCount++;
    });
    let endorsementCount = citizenEndorsements.length - revokeCount;
    badge.innerHTML = endorsementCount;
    const plural = (citizenEndorsements.length > 1) ? 'endorsements' : 'endorsement';
    let title = newElement(list, 'div', 'block-title', endorsementCount + '/' + citizenEndorsements.length + ' ' +
      plural);
    citizenEndorsements.forEach(function(endorsement) {
      let card = newElement(list, 'div', 'card');
      if (endorsement.revoke)
        card.classList.add('revoked');
      let content = newElement(card, 'div', 'card-content card-content-padding');
      let row = newElement(content, 'div', 'row');
      let col = newElement(row, 'div', 'col-25');
      let img = newElement(col, 'img');
      img.src = endorsement.picture;
      img.style.width = '100%';
      col = newElement(row, 'div', 'col-75');
      let a = newElement(col, 'a', 'link external',
        `<span style="font-weight:bold">${endorsement.familyName}</span> <span>${endorsement.givenNames}</span>`);
      a.href = `https://www.openstreetmap.org/?mlat=${endorsement.latitude}&mlon=${endorsement.longitude}&zoom=12`;
      a.target = '_blank';
      row = newElement(col, 'div', 'row');
      const t = new Date(endorsement.published).toISOString().slice(0, 10);
      newElement(row, 'div', 'col', (endorsement.revoke ? 'Revoked you on: ' : 'Endorsed you on: ') + t);
    });
  }

  function editOrRevokeKey(event) {
    let title, text, revoke;
    if (event.target.id === 'edit') {
      title = 'Edit your Citizen Card';
      text = '<p>You should edit your citizen card only if you move or change your name.</p>' +
        '<p>As a consequence, you will have to ask others to endorse you again.</p>';
      revoke = false;
    } else {
      title = 'Revoke your Private Key';
      text = '<p>You should revoke your private key only if you believe that someone compromised it.</p>' +
        '<p>As a consequence, these publications will be revoked and should be re-created:</p><ul>' +
        '<li>Your citizen card.</li>' +
        '<li>Given endorsements.</li>' +
        '<li>Received endorsements.</li></ul>';
      revoke = true;
    }
    text += '<p>Please type <b>I understand</b> here:</p>';

    app.dialog.create({
      title,
      text,
      content: '<div class="dialog-input-field item-input"><div class="item-input-wrap">' +
        '<input type="text" class="dialog-input"></div></div>',
      buttons: [{
          text: app.params.dialog.buttonCancel,
          keyCodes: app.keyboardActions ? [27] : null
        },
        {
          text: app.params.dialog.buttonOk,
          bold: true,
          keyCodes: app.keyboardActions ? [13] : null
        }],
      destroyOnClose: true,
      onClick: function(dialog, index) {
        if (index === 1) // OK
          editCitizenCard(revoke);
      },
      on: {
        open: function(d) {
          let input = d.$el.find('.dialog-input')[0];
          let okButton = d.$el.find('.dialog-button')[1];
          disable(okButton);
          input.addEventListener('input', function(event) {
            if (event.target.value === 'I understand')
              enable(okButton);
            else
              disable(okButton);
          });
          input.addEventListener('change', function(event) {
            if (event.target.value === 'I understand') {
              d.close();
              editCitizenCard(revoke);
            }
          });
        }
      }
    }).open();
  }
  document.getElementById('edit').addEventListener('click', editOrRevokeKey);
  document.getElementById('revoke-key').addEventListener(
    'click', editOrRevokeKey);

  document.getElementById('endorse-qr-video').addEventListener('loadedmetadata', qrVideo);
  document.getElementById(
    'referendum-qr-video').addEventListener('loadedmetadata', qrVideo);

  function qrVideo() {
    // display video as a square centered in the video rectangle
    if (this.videoWidth > this.videoHeight) {
      const margin = Math.round(-10000 * (this.videoWidth - this.videoHeight) / this.videoWidth) / 100.0;
      const size = -2 * margin + 100;
      this.style.width = size + '%';
      this.style.marginLeft = margin + '%';
      this.style.marginRight = margin + '%';
    } else {
      const margin = Math.round(-10000 * (this.videoHeight - this.videoWidth) / (2 * this.videoWidth)) / 100.0;
      this.style.width = '100%';
      this.style.marginTop = margin + '%';
      this.style.marginBottom = margin + '%';
    }
  }

  document.getElementById('endorse').addEventListener('click', function(event) {
    const button = event.target;
    const video = document.getElementById('endorse-qr-video');
    const list = document.getElementById('endorsements-list');
    const message = document.getElementById('endorse-message');

    if (scanner) { // Cancel pressed
      button.innerHTML = 'Endorse a Citizen';
      video.style.display = 'none';
      list.style.display = '';
      scanner.destroy();
      scanner = null;
      return;
    }

    function setResult(fingerprint) {
      const pattern = /^[0-9a-f]{40}$/g;
      if (!pattern.test(fingerprint)) {
        message.innerHTML = 'Wrong QR code reading: <b>' + fingerprint + '</b>';
        setTimeout(function() {
          message.innerHTML = endorseMessage;
        }, 10000);
        return;
      }
      if (fingerprint == citizenFingerprint) {
        message.innerHTML = 'You should not endorse yourself!';
        setTimeout(function() {
          message.innerHTML = endorseMessage;
        }, 10000);
        return;
      }
      message.innerHTML = 'Read: <b>' + fingerprint + '</b>';
      /* endorsedFingerprint = fingerprint; */
      scanner.destroy();
      scanner = null;
      video.style.display = 'none';
      list.style.display = '';
      disable(button);
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          endorsed = JSON.parse(this.responseText);
          if (endorsed.hasOwnProperty('error')) {
            message.innerHTML = endorsed.error;
            setTimeout(function() {
              message.innerHTML = endorseMessage;
            }, 10000);
            return;
          }
          // verify signature of endorsed
          let signature = endorsed.signature;
          endorsed.signature = '';
          let verify = new JSEncrypt();
          verify.setPublicKey(publicKey(endorsed.key));
          enable(button);
          if (!verify.verify(JSON.stringify(endorsed), signature, CryptoJS.SHA256)) {
            message.innerHTML = 'Cannot verify citizen signature';
            button.innerHTML = 'Endorse a Citizen';
            endorsed.signature = '';
            setTimeout(function() {
              message.innerHTML = endorseMessage;
            }, 10000);
            return;
          }
          endorsed.signature = signature;
          message.innerHTML = endorseMessage;
          button.style.display = 'none';
          message.style.display = 'none';
          document.getElementById('endorse-picture-check').checked = false;
          document.getElementById('endorse-name-check').checked = false;
          document.getElementById('endorse-coords-check').checked = false;
          document.getElementById('endorse-citizen').style.display = '';
          document.getElementById('endorse-picture').src = endorsed.picture;
          document.getElementById('endorse-family-name').innerHTML = endorsed.familyName;
          document.getElementById('endorse-given-names').innerHTML = endorsed.givenNames;
          const lat = endorsed.latitude;
          const lon = endorsed.longitude;
          document.getElementById('endorse-coords').innerHTML = lat + ', ' + lon;
          let published = new Date(endorsed.published);
          let expires = new Date(endorsed.expires);
          document.getElementById('endorse-published').innerHTML = published.toISOString().slice(0, 10);
          document.getElementById('endorse-expires').innerHTML = expires.toISOString().slice(0, 10);
          if (endorseMap == null) {
            endorseMap = L.map('endorse-map', {
              dragging: false
            });
            endorseMap.whenReady(function() {
              setTimeout(() => {
                this.invalidateSize();
              }, 0);
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(endorseMap);
            endorseMarker = L.marker([lat, lon]).addTo(endorseMap);
          } else
            endorseMarker.setLatLng([lat, lon]);
          endorseMarker.bindPopup(lat + ', ' + lon);
          endorseMap.setView([lat, lon], 18);
          endorseMap.on('contextmenu', function(event) {
            return false;
          });
          let xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              const a = JSON.parse(this.responseText);
              const address = a.display_name;
              endorseMarker.setPopupContent(address + '<br><br><center style="color:#999">(' +
                lat + ', ' + lon + ')</center>').openPopup();
            }
          };
          xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' +
            lon +
            '&zoom=10', true);
          xhttp.send();
        }
      };
      xhttp.open('GET', publisher + '/publication.php?fingerprint=' + fingerprint, true);
      xhttp.send();
    }
    video.style.display = '';
    button.innerHTML = 'Cancel';
    scanner = new QrScanner(video, fingerprint => setResult(fingerprint));
    scanner.start();
  });

  function updateEndorseConfirmButton() {
    let button = document.getElementById('endorse-confirm');
    if (document.getElementById('endorse-picture-check').checked &&
      document.getElementById('endorse-name-check').checked &&
      document.getElementById('endorse-coords-check').checked)
      enable('endorse-confirm');
    else
      disable('endorse-confirm');
  }
  document.getElementById('endorse-picture-check').addEventListener('change', updateEndorseConfirmButton);
  document.getElementById(
    'endorse-name-check').addEventListener('change', updateEndorseConfirmButton);
  document.getElementById(
    'endorse-coords-check').addEventListener('change', updateEndorseConfirmButton);

  function resetEndorse() {
    document.getElementById('endorse-citizen').style.display = 'none';
    document.getElementById('endorse-message').style.display = '';
    let button = document.getElementById('endorse');
    button.style.display = '';
    button.innerHTML = 'Endorse a Citizen';
  }
  document.getElementById('endorse-cancel').addEventListener('click', function(event) {
    resetEndorse();
  });
  document.getElementById('endorse-confirm').addEventListener('click', function(event) {
    disable('endorse-confirm');
    disable('endorse-cancel');
    let endorsement = {
      schema: 'https://directdemocracy.vote/json-schema/' + DIRECTDEMOCRACY_VERSION + '/endorsement.schema.json',
      key: citizen.key,
      signature: '',
      published: new Date().getTime(),
      expires: endorsed.expires,
      publication: {
        key: endorsed.key,
        signature: endorsed.signature
      }
    };
    endorsement.signature = citizenCrypt.sign(JSON.stringify(endorsement), CryptoJS.SHA256, 'sha256');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          app.dialog.alert(answer.error + '.<br>Please try again.', 'Endorsement Error');
        else {
          app.dialog.alert('You successfully endorsed ' + endorsed.givenNames + ' ' + endorsed.familyName,
            'Endorsement Success');
          endorsements = answer;
          updateEndorsements();
        }
        enable('endorse-cancel');
        resetEndorse();
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(endorsement));
  });

  function updateEndorsements() {
    let list = document.getElementById('endorsements-list');
    list.innerHTML = ''; // clear
    let count = 0;
    endorsements.forEach(function(endorsement) {
      let card = newElement(list, 'div', 'card');
      if (endorsement.revoke)
        card.classList.add('revoked');
      else
        count++;
      let content = newElement(card, 'div', 'card-content card-content-padding');
      let row = newElement(content, 'div', 'row');
      let col = newElement(row, 'div', 'col-25');
      let img = newElement(col, 'img');
      img.src = endorsement.picture;
      img.style.width = '100%';
      col = newElement(row, 'div', 'col-75');
      let a = newElement(col, 'a', 'link external',
        `<span style="font-weight:bold">${endorsement.familyName}</span> <span>${endorsement.givenNames}</span>`);
      a.href = `https://www.openstreetmap.org/?mlat=${endorsement.latitude}&mlon=${endorsement.longitude}&zoom=12`;
      a.target = '_blank';
      row = newElement(col, 'div', 'row');
      const t = new Date(endorsement.published).toISOString().slice(0, 10);
      newElement(row, 'div', 'col', (endorsement.revoke ? 'Revoked: ' : 'Endorsed: ') + t);
      if (!endorsement.revoke) {
        row = newElement(col, 'div', 'row');
        newElement(row, 'div', 'col', 'Expires: ' + new Date(endorsement.expires).toISOString().slice(0, 10));
        row = newElement(col, 'div', 'row');
        let c = newElement(row, 'div', 'col text-align-right');
        a = newElement(c, 'a', 'link', 'Revoke');
        a.href = '#';
        a.style.fontWeight = 'bold';
        a.style.textTransform = 'uppercase';
        a.addEventListener('click', function() {
          function revoke() {
            let e = {
              schema: 'https://directdemocracy.vote/json-schema/' + DIRECTDEMOCRACY_VERSION +
                '/endorsement.schema.json',
              key: citizen.key,
              signature: '',
              published: new Date().getTime(),
              expires: endorsement.expires,
              revoke: true,
              publication: {
                key: endorsement.key,
                signature: endorsement.signature
              }
            };
            e.signature = citizenCrypt.sign(JSON.stringify(e), CryptoJS.SHA256, 'sha256');
            let xhttp = new XMLHttpRequest();
            xhttp.onload = function() {
              if (this.status == 200) {
                let answer = JSON.parse(this.responseText);
                if (answer.error)
                  app.dialog.alert(answer.error + '.<br>Please try again.', 'Revocation error');
                else {
                  app.dialog.alert('You successfully revoked ' + endorsement.givenNames + ' ' +
                    endorsement.familyName, 'Revocation success');
                  endorsements = answer;
                  updateEndorsements();
                }
              }
            };
            xhttp.open('POST', publisher + '/publish.php', true);
            xhttp.send(JSON.stringify(e));
          }
          const text = "<p>You should revoke only a citizen who has moved or " +
            "changed her citizen card. This might affect her ability to vote.</p>" +
            "<p>Do you really want to revoke <b>" + endorsement.givenNames + ' ' + endorsement.familyName +
            "</b>?</p>" +
            "<p>Please type <b>I understand</b> here:</p>";
          app.dialog.create({
            title: 'Revoke Citizen',
            text,
            content: '<div class="dialog-input-field item-input"><div class="item-input-wrap">' +
              '<input type="text" class="dialog-input"></div></div>',
            buttons: [{
                text: app.params.dialog.buttonCancel,
                keyCodes: app.keyboardActions ? [27] : null
              },
              {
                text: app.params.dialog.buttonOk,
                bold: true,
                keyCodes: app.keyboardActions ? [13] : null
              }],
            destroyOnClose: true,
            onClick: function(dialog, index) {
              if (index === 1) // OK
                revoke();
            },
            on: {
              open: function(d) {
                let input = d.$el.find('.dialog-input')[0];
                let okButton = d.$el.find('.dialog-button')[1];
                disable(okButton);
                input.addEventListener('input', function(event) {
                  if (event.target.value === 'I understand')
                    enable(okButton);
                  else
                    disable(okButton);
                });
                input.addEventListener('change', function(event) {
                  if (event.target.value === 'I understand') {
                    d.close();
                    revoke();
                  }
                });
              }
            }
          }).open();
        });
      }
    });
    let badge = document.getElementById('endorse-badge');
    badge.innerHTML = count;
    badge.style.display = (count == 0) ? 'none' : '';
  }

  function addReferendum(tab, referendum, index, state, top) {
    const fingerprint = CryptoJS.SHA1(referendum.signature).toString();
    let vote = votes.find(vote => vote.referendum === fingerprint);
    if (vote === undefined) {
      vote = {
        referendum: fingerprint
      };
      votes.push(vote);
    }

    const first_equal = referendum.area.indexOf('=');
    const first_newline = referendum.area.indexOf('\n');
    let areaName = referendum.area.substr(first_equal + 1, first_newline - first_equal);
    let areaType = referendum.area.substr(0, first_equal);
    const area_array = referendum.area.split('\n');
    let area_query = '';
    area_array.forEach(function(argument) {
      const eq = argument.indexOf('=');
      let type = argument.substr(0, eq);
      if (type === 'village')
        type = 'city';
      const name = argument.substr(eq + 1);
      if (type)
        area_query += type + '=' + encodeURIComponent(name) + '&';
    });
    area_query = area_query.slice(0, -1);
    let area_url;
    if (!areaType) {
      areaType = 'world';
      areaName = 'Earth';
      area_url = 'https://en.wikipedia.org/wiki/Earth';
    } else if (areaType == 'union')
      area_url = 'https://en.wikipedia.org/wiki/European_Union';
    else
      area_url = 'https://nominatim.openstreetmap.org/search.php?' + area_query +
      '&polygon_geojson=1';

    if (state.previousAreaName != areaName && state.previousAreaType != areaType) {
      let title = newElement(tab, 'div', 'block-title',
        `<a class="link external" href="${area_url}" target="_blank">${areaName}</a> <small>(${areaType})</small>`
      );
      if (top) {
        title.style.background = 'white';
        title.style.margin = 0;
        title.style.padding = '16px';
      }
      let list = newElement(tab, 'div', 'list accordion-list');
      state.topUl = newElement(list, 'ul');
    }
    state.previousAreaName = areaName;
    state.previousAreaType = areaType;
    let li = newElement(state.topUl, 'li', 'accordion-item');
    let a = newElement(li, 'a', 'item-content item-link');
    let item = newElement(a, 'div', 'item-inner');
    newElement(item, 'div', 'item-title', referendum.title);
    let after = newElement(item, 'div', 'item-after');
    let badge = newElement(after, 'div', 'badge', referendum.participation);
    badge.id = 'badge-' + index;
    const days = Math.floor((referendum.deadline - new Date().getTime()) / 86400000);
    if (days >= 0) {
      if (vote.hasOwnProperty('public'))
        badge.classList.add('color-blue');
      else {
        availableReferendum++;
        if (days <= 3)
          badge.classList.add('color-red');
        else if (days < 7)
          badge.classList.add('color-orange');
        else
          badge.classList.add('color-green');
      }
    } else badge.classList.add('color-gray');
    let content = newElement(li, 'div', 'accordion-item-content');
    let block = newElement(content, 'div', 'block');
    newElement(block, 'p', '', referendum.description);
    if (referendum.website) {
      newElement(block, 'p', '',
        `<a class="link external" href="${referendum.website}" target="_blank">Official web site</a>.`
      );
    }
    newElement(block, 'p', '', '<i>' + referendum.question + '</i>');
    let list = newElement(block, 'div', 'list');
    let ul = newElement(list, 'ul');
    const answers = referendum.answers.split('\n');
    let count = 0;
    answers.forEach(function(answer) {
      count++;
      li = newElement(ul, 'li');
      let label = newElement(li, 'label', 'item-radio item-radio-icon-start item-content');
      let input = newElement(label, 'input');
      input.type = 'radio';
      input.name = 'answer-' + index;
      input.value = answer;
      if (count == 1)
        input.checked = true;
      newElement(label, 'i', 'icon icon-radio');
      newElement(label, 'div', 'item-inner', answer);
      input.addEventListener('click', function() {
        updateVoteKey(index, vote);
      });
    });
    let row = newElement(block, 'div', 'row');
    let col = newElement(row, 'div', 'col-80');
    let button = newElement(col, 'div', 'button button-fill');
    let message = newElement(col, 'div', 'item-label text-align-center');
    button.id = 'vote-button-' + index;
    let trash = newElement(row, 'div', 'col-20 button', '<i class="icon f7-icons">trash</i>');
    message.id = 'vote-message-' + index;
    updateVoteKey(index, vote);
    let bottom = newElement(block, 'div', 'padding-top');
    newElement(bottom, 'div', 'float-left', 'Deadline: <i>' + new Date(referendum.deadline).toLocaleString() +
      '</i>');
    const results_url = publisher + '/referendum.html?fingerprint=' + CryptoJS.SHA1(referendum.signature)
      .toString();
    newElement(bottom, 'div', 'float-right padding-bottom', '<a class="link external" href="' +
      results_url + '" target="_blank">Results</a>');
    button.addEventListener('click', function(event) {
      app.preloader.show();
      let crypt = new JSEncrypt();
      vote.private = voteKeyPool.shift();
      crypt.setPrivateKey(vote.private);
      vote.public = strippedKey(crypt.getPublicKey());
      localStorage.setItem('voteKeyPool', JSON.stringify(voteKeyPool));
      updateVoteKey(index, vote);
      createNewVoteKey();
      let ballot = {
        schema: 'https://directdemocracy.vote/json-schema/' + DIRECTDEMOCRACY_VERSION +
          '/ballot.schema.json',
        key: vote.public,
        signature: '',
        published: referendum.deadline,
        expires: referendum.deadline + 365.25 * 24 * 60 * 60 * 1000, // 1 year
        referendum: referendum.key,
        station: {
          key: stationKey
        }
      };
      ballot.signature = crypt.sign(JSON.stringify(ballot), CryptoJS.SHA256, 'sha256');
      const now = new Date().getTime();
      let registration = {
        schema: 'https://directdemocracy.vote/json-schema/' + DIRECTDEMOCRACY_VERSION +
          '/registration.schema.json',
        key: citizen.key,
        signature: '',
        published: now,
        expires: now + 365.25 * 24 * 60 * 60 * 1000, // 1 year
        referendum: referendum.key,
        station: {
          key: stationKey
        }
      };
      registration.signature = citizenCrypt.sign(JSON.stringify(registration), CryptoJS.SHA256,
        'sha256');
      let request = {
        ballot: ballot,
        registration: registration
      };
      let xhttp = new XMLHttpRequest();
      xhttp.onload = function() {
        app.preloader.hide();
        if (this.status != 200) {
          console.log('Station not responding: ' + this.status);
          // FIXME: allow to try to vote again
        } else {
          let response = JSON.parse(this.responseText);
          if (response.error) {
            app.dialog.alert(response.error, 'Register error');
            return;
          }
          if (!response.hasOwnProperty('ballot')) {
            app.dialog.alert('Missing ballot in station response.', 'Register error');
            return;
          }
          if (!response.hasOwnProperty('registration')) {
            app.dialog.alert('Missing registration in station response.', 'Register error');
            return;
          }
          let ballot = response.ballot;
          let registration = response.registration;
          // verify the fields of the ballot didn't change.
          let keys = Object.keys(ballot);
          if (!keys.includes('schema') || !keys.includes('key') || !keys.includes('signature') ||
            !keys.includes('published') || !keys.includes('expires') || !keys.includes(
              'referendum') ||
            !keys.includes('station')) {
            app.dialog.alert('Missing field in ballot.', 'Register error');
            return false;
          }
          if (keys.length != 7) {
            app.dialog.alert('Extra fields in ballot.', 'Register error');
            return false;
          }
          if (ballot.schema != 'https://directdemocracy.vote/json-schema/' +
            DIRECTDEMOCRACY_VERSION +
            '/ballot.schema.json') {
            app.dialog.alert('Wrong schema in ballot.', 'Register error');
            return;
          }
          if (ballot.key != vote.public) {
            app.dialog.alert('Wrong ballot key.', 'Register error');
            return;
          }
          if (ballot.signature !== '') {
            app.dialog.alert('Ballot signature should be empty.', 'Register error');
            return;
          }
          if (ballot.published != referendum.deadline) {
            app.dialog.alert('Wrong published date in ballot.', 'Register error');
            return;
          }
          if (ballot.expires != referendum.deadline + 365.25 * 24 * 60 * 60 * 1000) {
            app.dialog.alert('Wrong expires date in ballot.', 'Register error');
            return;
          }
          if (ballot.referendum != referendum.key) {
            app.dialog.alert('Wrong referendum key in ballot.', 'Register error');
            return;
          }
          keys = Object.keys(ballot.station);
          if (!keys.includes('key') || !keys.includes('signature')) {
            app.dialog.alert('Missing station key or signature in ballot.', 'Register error');
            return;
          }
          if (keys.length > 2) {
            app.dialog.alert('Extra station fields in ballot.', 'Register error');
            return;
          }
          if (ballot.station.key != stationKey) {
            app.dialog.alert('Wrong station key in ballot.', 'Register error');
            return;
          }
          // check the signature of the station
          const ballot_station_signature = ballot.station.signature;
          delete ballot.station.signature;
          let verify = new JSEncrypt();
          verify.setPublicKey(publicKey(ballot.station.key));
          if (!verify.verify(JSON.stringify(ballot), ballot_station_signature, CryptoJS.SHA256)) {
            app.dialog.alert('Wrong station signature for ballot.', 'Register error');
            return;
          }
          ballot.station.signature = ballot_station_signature;

          // verify the key of the registration didn't change
          if (!registration.hasOwnProperty('key')) {
            app.dialog.alert('Missing key in registration.', 'Register error');
            return;
          }
          if (registration.key != citizen.key) {
            app.dialog.alert('The key in registration is wrong.', 'Register error');
            return;
          }
          // verify the station signature in the registration
          if (!registration.hasOwnProperty('station')) {
            app.dialog.alert('Missing station in registration.', 'Register error');
            return;
          }
          if (!registration.station.hasOwnProperty('key')) {
            app.dialog.alert('Missing station key in registration.', 'Register error');
            return;
          }
          if (!registration.station.hasOwnProperty('signature')) {
            app.dialog.alert('Missing station signature in registration.', 'Register error');
            return;
          }
          const registration_station_signature = registration.station.signature;
          delete registration.station.signature;
          verify = new JSEncrypt();
          verify.setPublicKey(publicKey(registration.station.key));
          if (!verify.verify(JSON.stringify(registration), registration_station_signature,
              CryptoJS
              .SHA256)) {
            app.dialog.alert('Wrong station signature for registration.', 'Register error');
            return;
          }
          // verify the registration signature
          if (!registration.hasOwnProperty('signature')) {
            app.dialog.alert('Missing signature in registration.', 'Register error');
            return;
          }
          const registration_signature = registration.signature;
          registration.signature = '';
          verify = new JSEncrypt();
          verify.setPublicKey(publicKey(registration.key));
          if (!verify.verify(JSON.stringify(registration), registration_signature, CryptoJS.SHA256)) {
            app.dialog.alert('Wrong registration signature.', 'Register error');
            return;
          }
          // restore signatures
          registration.signature = registration_signature;
          registration.station.signature = registration_station_signature;
          // check match between ballot and registration
          if (ballot.referendum != registration.referendum) {
            app.dialog.alert('Mismatching referendum in ballot and registration.',
              'Register error');
            return;
          }
          if (ballot.station.key != registration.station.key) {
            app.dialog.alert('Mismatching referendum in ballot and registration.',
              'Register error');
            return;
          }
          // save registration (can be a proof against cheating station)
          registrations.push(registration);
          localStorage.setItem('registrations', JSON.stringify(registrations));
          // proceed to vote
          document.getElementById('vote-message-' + index).innerHTML = "Registration success";
          let radios = document.getElementsByName('answer-' + index);
          let answer = '';
          for (let i = 0, length = radios.length; i < length; i++)
            if (radios[i].checked) {
              answer = radios[i].value;
              break;
            } else console.log("Not " + radios[i].checked + " - " + radios[i].value);
          console.log("voting: " + answer);
          let crypt = new JSEncrypt();
          crypt.setPrivateKey(vote.private);
          ballot.answer = answer;
          ballot.signature = crypt.sign(JSON.stringify(ballot), CryptoJS.SHA256, 'sha256');
          let xhttp = new XMLHttpRequest();
          xhttp.onload = function() {
            if (this.status == 200) {
              let response = JSON.parse(this.responseText);
              if (response.error) {
                app.dialog.alert(response.error, 'Vote error');
                return;
              }
              console.log("Ballot fingerprint: " + response.fingerprint);
              badge.classList.remove('color-red');
              badge.classList.remove('color-orange');
              badge.classList.remove('color-green');
              badge.classList.add('color-blue');
              badge.innerHTML = parseInt(badge.innerHTML) + 1;
              let voteBadge = document.getElementById('vote-badge');
              const n = parseInt(voteBadge.innerHTML);
              if (n < 1)
                console.log("ERROR: Vote badge is smaller than 1. This should not happen...");
              if (n == 1)
                voteBadge.style.display = 'none';
              voteBadge.innerHTML = n - 1;
              delete vote.private;
              vote.public = strippedKey(crypt.getPublicKey());
              vote.date = Math.round(new Date().getTime() / 1000);
              localStorage.setItem('votes', JSON.stringify(votes));
              updateVoteKey(index, vote);
            }
          };
          xhttp.open('POST', publisher + '/publish.php', true);
          xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhttp.send(JSON.stringify(ballot));
        }
      };
      xhttp.open('POST', station + '/register.php', true);
      xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhttp.send(JSON.stringify(request));
    });
  }

  function updateArea() {
    let xhttp = new XMLHttpRequest();
    xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' +
      citizen.latitude + '&lon=' + citizen.longitude + '&zoom=10', true);
    xhttp.send();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const a = JSON.parse(this.responseText);
        const address = a.address;
        let type = [];
        let name = [];

        function addAdminLevel(level) {
          if (level in address) {
            type.push(level);
            name.push(address[level]);
          }
        }
        const admin = ['block', 'neighbourhood', 'quarter',
          'suburb', 'borough',
          'hamlet', 'village', 'town',
          'city',
          'municipality',
          'county', 'district',
          'region', 'province', 'state',
          'country'
        ];
        admin.forEach(function(item) {
          addAdminLevel(item);
        });
        const countryCode = address.country_code.toUpperCase();
        if (['GB', 'DE', 'FR', 'IT', 'SE', 'PL', 'RO', 'HR', 'ES', 'NL', 'IE', 'BG', 'DK', 'GR',
            'AT', 'HU', 'FI', 'CZ', 'PT', 'BE', 'MT', 'CY', 'LU', 'SI', 'LU', 'SK', 'EE', 'LV'
          ]
          .indexOf(countryCode) >= 0) {
          type.push('union');
          name.push('European Union');
        }
        area = '';
        name.forEach(function(n, i) {
          area += type[i] + '=' + name[i] + '\n';
        });
        updateVote();
        document.getElementById('referendum-reference').classList.remove('disabled');
        document.getElementById('referendum-scan').classList.remove('disabled');
        document.getElementById('referendum-paste').classList.remove('disabled');
      }
    };
  }

  function updateVote() {
    let fingerprints = '';
    votes.forEach(function(vote) {
      if (vote.public)
        fingerprints += vote.referendum + ',';
    });
    if (fingerprints !== '')
      fingerprints = '&fingerprints=' + encodeURIComponent(fingerprints.slice(0, -1));
    let xhttp = new XMLHttpRequest();
    xhttp.open('POST', publisher + '/referendum.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('area=' + encodeURIComponent(area) + fingerprints);
    xhttp.onload = function() {
      if (this.status == 200) {
        referendums = JSON.parse(this.responseText);
        if (referendums.error)
          console.log(referendums.error);
        let tab = document.getElementById('tab-vote');
        let propose = newElement(null, 'div', 'block-title',
          'Propose a <a class="link external" href="referendum.html" target="_blank">new referendum</a>');
        if (referendums.length == 0) {
          newElement(tab, 'div', 'block-title', 'No referendum available');
          tab.appendChild(propose);
          return;
        }
        let previousAreaName = '';
        let previousAreaType = '';
        let topUl = null;
        availableReferendum = 0;
        let state = {
          previousAreaName: '',
          previousAreaType: '',
          topUp: null
        };
        referendums.forEach(function(referendum, index) {
          addReferendum(tab, referendum, index, state, false);
        });
        let badge = document.getElementById('vote-badge');
        if (availableReferendum) {
          badge.innerHTML = availableReferendum;
          badge.style.display = '';
        } else badge.style.display = 'none';
        tab.appendChild(propose);
      }
    };
  }

  function disableAnswer(index, erase) {
    console.log("disableAnswer");
    let answers = document.getElementsByName('answer-' + index);
    answers.forEach(function(answer) {
      if (erase)
        answer.checked = false;
      disable(answer.parentNode);
    });
  }

  function checkVote(event) { // query publisher to get verification
    let button = event.target;
    let index = parseInt(button.id.substring(12));
    console.log('index = ' + index);
    let vote = votes[index];
    let xhttp = new XMLHttpRequest();
    xhttp.open('POST', publisher + '/publication.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    console.log('publication key = ' + vote.public);
    xhttp.send('key=' + encodeURIComponent(vote.public));
    xhttp.onload = function() {
      if (this.status == 200) {
        let response = JSON.parse(this.responseText);
        if (response.error)
          app.dialog.alert(response.error, 'Vote check error');
        else {
          answer = response.answer;
          console.log("answer = " + answer);
          let radios = document.getElementsByName('answer-' + index);
          for (let i = 0, length = radios.length; i < length; i++)
            if (radios[i].value == answer) {
              radios[i].checked = true;
              break;
            }
        }
      }
    };
  }

  function setCheckVoteButton(index, vote) {
    console.log("disabling vote options");
    let button = document.getElementById('vote-button-' + index);
    let newButton = button.cloneNode(false); // remove event listeners
    button.parentNode.replaceChild(newButton, button);
    button = newButton;
    button.classList.remove('color-green');
    button.classList.add('color-blue');
    button.innerHTML = 'Check Vote';
    button.addEventListener('click', checkVote);
    disableAnswer(index, true);
    enable(button);
  }

  function updateVoteKey(index, vote) {
    let button = document.getElementById('vote-button-' + index);
    let message = document.getElementById('vote-message-' + index);
    if (!button || index >= referendums.length)
      return;
    const expired = new Date().getTime() > referendums[index].deadline;
    if (stationKey === '') {
      message.innerHTML = 'Getting station key, please wait...';
      disable(button);
    } else if (voteKeyPool.length == 0) {
      message.innerHTML = 'Forging vote key, please wait...';
      disable(button);
    } else if (vote.hasOwnProperty('public')) {
      if (vote.hasOwnProperty('private')) {
        disable(button);
        disableAnswer(index, false);
        button.innerHTML = 'Voting...';
      } else {
        message.innerHTML = 'Vote cast on ' + new Date(vote.date * 1000).toLocaleString().slice(0, -3);
        if (expired)
          setCheckVoteButton(index, vote);
        else {
          button.innerHTML = 'Vote cast!'; // French: "a voté !"
          disable(button);
          disableAnswer(index, true);
        }
      }
    } else if (expired) {
      button.innerHTML = 'Not Voted';
      message.innerHTML = 'Deadline has passed.';
      disable(button);
      disableAnswer(index, true);
    } else if (document.querySelector('input[name="answer-' + index + '"]:checked')) {
      button.innerHTML = 'Vote';
      message.innerHTML = 'Think twice before you vote, there is no undo.';
      enable(button);
    } else {
      message.innerHTML = 'Select an answer to vote.';
      disable(button);
    }
  }
};
