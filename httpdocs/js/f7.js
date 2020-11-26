import QrScanner from './qr-scanner.min.js';
QrScanner.WORKER_PATH = 'js/qr-scanner-worker.min.js';

let app = new Framework7({
  root: '#app',
  name: 'directdemocracy.vote',
  id: 'directdemocracy.vote',
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
  let endorsements = [];
  let citizenEndorsements = [];
  let citizenCrypt = null;
  let citizenFingerprint = null;
  let endorseMessage = "Scan the QR code of another citizen's card to endorse her.";
  let endorseMap = null;
  let endorseMarker = null;
  let scanner = null;
  let endorsed = null;
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
  document.getElementById('station').addEventListener('input', function(event) {
    localStorage.setItem('station', event.target.value);
  });

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
  document.getElementById('register-given-names').addEventListener('input', validateRegistration);
  document.getElementById('register-confirm-check').addEventListener('input', validateRegistration);
  document.getElementById('register-upload-button').addEventListener('click', uploadPicture);
  document.getElementById('register-picture').addEventListener('click', uploadPicture);
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
          app.dialog.alert(JSON.stringify(answer.error) + '.<br>Please try again.', 'Publication Error');
        else {
          /*
          localStorage.setItem('privateKey', private_key);
          document.getElementById('citizen-nav').style.display = '';
          document.getElementById('endorsements-nav').style.display = '';
          document.getElementById('register-nav').style.display = 'none';
          document.getElementById('revoke-key').removeAttribute('disabled');
          document.getElementById('edit').removeAttribute('disabled');
          $('.nav-tabs a[href="#citizen"]').tab('show');
          */
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
          app.dialog.alert(JSON.stringify(answer.error) + '.<br>Please try again.', 'Citizen Error');
        else {
          citizen = answer.citizen;
          citizen.key = strippedKey(citizenCrypt.getPublicKey());
          endorsements = answer.endorsements;
          citizenEndorsements = answer.citizen_endorsements;
          updateCitizenCard();
          updateEndorsements();
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
    document.getElementById('tab-card-title').innerHTML = 'Edit Citizen Card' + (revoke ? ' <small>(revoked key)</small>' :
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

  function newElement(parent, type, class0, class1) {
    let element = document.createElement(type);
    parent.appendChild(element);
    if (class0) {
      element.classList.add(class0);
      if (class1)
        element.classList.add(class1);
    }
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
    document.getElementById('citizen-coords').innerHTML = '<a target="_blank" href="https://openstreetmap.org/?mlat=' +
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
    const width = screen.width * 0.95;
    const size = width > height ? height : width;
    let qr = new QRious({
      element: qrImage,
      value: citizenFingerprint,
      level: 'M',
      size,
      padding: 0
    });
    console.log(citizenFingerprint);
    document.getElementById('citizen-qr-code').style.width = size + 'px';
    document.getElementById('citizen-qr-code').style.height = size + 'px';
    // get reputation from trustee
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let reputation = document.getElementById('citizen-reputation');
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          reputation.innerHTML = '<span style="font-weight:bold;color:red">' + answer.error + "</span>";
        else {
          const color = answer.endorsed ? 'green' : 'red';
          reputation.innerHTML = '<span style="font-weight:bold;color:' + color + '">' + answer.reputation + '</span>';
        }
      }
    };
    xhttp.open('GET', trustee + '/reputation.php?key=' + encodeURIComponent(citizen.key), true);
    xhttp.send();
    let list = document.getElementById('citizen-endorsements-list');
    if (citizenEndorsements.length == 0) {
      list.innerHTML =
        '<div class="block-title block-title-medium">Not endorsed</div>' +
        '<div class="block">You should ask to other citizens to endorse you.</div>';
      return;
    }
    let revokeCount = 0;
    citizenEndorsements.forEach(function(endorsement) {
      if (endorsement.revoke)
        revokeCount++;
    });
    let endorsementCount = citizenEndorsements.length - revokeCount;
    let badge = document.getElementById('endorsed-badge');
    badge.innerHTML = endorsementCount;
    badge.style.display = (endorsementCount == 0) ? 'none' : '';
    let title = newElement(list, 'div', 'block-title', 'block-title-medium');
    let plural = (citizenEndorsements.length > 1) ? 'endorsements' : 'endorsement';
    title.innerHTML = endorsementCount + '/' + citizenEndorsements.length + ' ' + plural;
    citizenEndorsements.forEach(function(endorsement) {
      let card = newElement(list, 'div', 'card');
      if (endorsement.revoke)
        card.classList.add('revoked');
      let content = newElement(card, 'div', 'card-content', 'card-content-padding');
      let row = newElement(content, 'div', 'row');
      let col = newElement(row, 'div', 'col-25');
      let img = newElement(col, 'img');
      img.src = endorsement.picture;
      img.style.width = '100%';
      col = newElement(row, 'div', 'col-75');
      let a = newElement(col, 'a');
      a.href = publisher + '/publication.php?fingerprint=' + CryptoJS.SHA1(endorsement.signature).toString();
      a.target = '_blank';
      let b = newElement(a, 'b');
      b.appendChild(document.createTextNode(endorsement.familyName));
      a.appendChild(document.createTextNode(' ' + endorsement.givenNames));
      row = newElement(col, 'div', 'row');
      let c = newElement(row, 'div', 'col');
      let t = new Date(endorsement.published).toISOString().slice(0, 10);
      c.innerHTML = (endorsement.revoke ? 'Revoked you on: ' : 'Endorsed you on: ') + t;
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
  document.getElementById('revoke-key').addEventListener('click', editOrRevokeKey);

  document.getElementById('endorse-qr-video').addEventListener('loadedmetadata', function() {
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
  });

  document.getElementById('endorse').addEventListener('click', function(event) {
    console.log('endorse');
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
      button.classList.add('disabled');
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
          button.classList.remove('disabled');
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
          xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon +
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
  document.getElementById('endorse-name-check').addEventListener('change', updateEndorseConfirmButton);
  document.getElementById('endorse-coords-check').addEventListener('change', updateEndorseConfirmButton);

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
          app.dialog.alert(JSON.stringify(answer.error) + '.<br>Please try again.', 'Endorsement Error');
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
      let content = newElement(card, 'div', 'card-content', 'card-content-padding');
      let row = newElement(content, 'div', 'row');
      let col = newElement(row, 'div', 'col-25');
      let img = newElement(col, 'img');
      img.src = endorsement.picture;
      img.style.width = '100%';
      col = newElement(row, 'div', 'col-75');
      let a = newElement(col, 'a');
      a.href = publisher + '/publication.php?fingerprint=' + CryptoJS.SHA1(endorsement.signature).toString();
      a.target = '_blank';
      let b = newElement(a, 'b');
      b.appendChild(document.createTextNode(endorsement.familyName));
      a.appendChild(document.createTextNode(' ' + endorsement.givenNames));
      row = newElement(col, 'div', 'row');
      let c = newElement(row, 'div', 'col');
      let t = new Date(endorsement.published).toISOString().slice(0, 10);
      c.innerHTML = (endorsement.revoke ? 'Revoked: ' : 'Endorsed: ') + t;
      if (!endorsement.revoke) {
        row = newElement(col, 'div', 'row');
        c = newElement(row, 'div', 'col');
        t = new Date(endorsement.expires).toISOString().slice(0, 10);
        c.innerHTML = 'Expires: ' + t;
        row = newElement(col, 'div', 'row');
        c = newElement(row, 'div', 'col', 'text-align-right');
        a = newElement(c, 'a', 'link');
        a.href = '#';
        a.style.fontWeight = 'bold';
        a.style.textTransform = 'uppercase';
        a.innerHTML = 'Revoke';
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
                  app.dialog.alert(JSON.stringify(answer.error) + '.<br>Please try again.', 'Revocation error');
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
};
