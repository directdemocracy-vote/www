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

  let publisher = localStorage.getItem('publisher');
  if (!publisher) {
    publisher = 'https://publisher.directdemocracy.vote';
    localStorage.setItem('publisher', publisher);
  }
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
          app.dialog.alert('Publication error: ' + JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          /*
          localStorage.setItem('privateKey', private_key);
          updateCitizenCard();
          document.getElementById('citizen-nav').style.display = '';
          document.getElementById('endorsements-nav').style.display = '';
          document.getElementById('register-nav').style.display = 'none';
          document.getElementById('revoke-key').removeAttribute('disabled');
          document.getElementById('edit').removeAttribute('disabled');
          $('.nav-tabs a[href="#citizen"]').tab('show');
          */
          updateCitizenCard();
          app.dialog.alert('Congratulation: Your citizen card was just published!');
          window.localStorage.setItem('registered', true);
        }
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(citizen));
    return false;
  });
  if (window.localStorage.getItem('registered')) {
    console.log('registered');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          app.dialog.alert('Citizen error: ' + JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          citizen = answer.citizen;
          citizen.key = strippedKey(citizenCrypt.getPublicKey());
          endorsements = answer.endorsements;
          citizenEndorsements = answer.citizen_endorsements;
          updateCitizenCard();
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
    const cardItems = ['tabbar-endorse', 'tab-endorse', 'tabbar-vote', 'tab-vote', 'edit', 'revoke-key'];
    cardItems.forEach(function(i) {
      if (page === 'card')
        enable(i);
      else
        disable(i);
    });
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
    let citizenFingerprint = CryptoJS.SHA1(citizen.signature).toString();
    let qrImage = document.getElementById('citizen-qr-code');
    const rect = qrImage.getBoundingClientRect();
    const rect2 = document.getElementById('tabbar').getBoundingClientRect();
    const height = rect2.top - rect.top + 20;
    const width = screen.width * 0.95;
    const size = width > height ? height : width;
    console.log("width = " + width + " height = " + height + " => size = " + size);
    let qr = new QRious({
      element: qrImage,
      value: citizenFingerprint,
      level: 'M',
      size: size,
      padding: 13
    });
    document.getElementById('citizen-qr-code').style.width = size + 'px';
    document.getElementById('citizen-qr-code').style.height = size + 'px';
    /*
    // get reputation from trustee
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let reputation = document.getElementById('citizen-reputation');
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          reputation.innerHTML = 'Reputation error: <span style="color:red">' + answer.error + "</span>";
        else {
          const color = answer.endorsed ? 'green' : 'red';
          reputation.innerHTML = 'Reputation: <span style="color:' + color + '">' + answer.reputation + '</span>';
        }
      }
    };
    xhttp.open('GET', trustee + '/reputation.php?key=' + encodeURIComponent(citizen.key), true);
    xhttp.send();
    let list = document.getElementById('citizen-endorsements-list');
    if (citizen_endorsements.length == 0) {
      list.innertHTML = '<br><h4>Your citizen card no endorsement</h4>You should ask to other citizen to endorse you.';
      return;
    }
    let revoke_count = 0;
    citizen_endorsements.forEach(function(endorsement) {
      if (endorsement.revoke)
        revoke_count++;
    });
    let endorsement_count = citizen_endorsements.length - revoke_count;
    let heading = '';
    if (endorsement_count) {
      heading += 'Endorsed by ' + endorsement_count;
      if (revoke_count)
        heading += ' &ndash; ';
    }
    if (revoke_count)
      heading += 'Revoked by ' + revoke_count;
    list.innerHTML = '<br><h4>' + heading + ':</h4>';
    let table = document.createElement('table');
    table.classList.add('table');
    table.style.width = '100%';
    table.style.maxWidth = '400px';
    list.appendChild(table);
    citizen_endorsements.forEach(function(endorsement) {
      let tr = document.createElement('tr');
      table.appendChild(tr);
      let td = document.createElement('td');
      tr.appendChild(td);
      let img = document.createElement('img');
      td.setAttribute('rowspan', '2');
      td.appendChild(img);
      img.src = endorsement.picture;
      img.style.width = '45px';
      img.style.height = '60px';
      td = document.createElement('td');
      if (endorsement.revoke)
        td.style.fontStyle = 'italic';
      td.setAttribute('colspan', '2');
      tr.appendChild(td);
      let a = document.createElement('a');
      td.appendChild(a);
      a.href = publisher + '/publication.php?fingerprint=' + endorsement.fingerprint;
      a.target = '_blank';
      let b = document.createElement('b');
      b.appendChild(document.createTextNode(endorsement.familyName));
      a.appendChild(b);
      a.appendChild(document.createTextNode(' ' + endorsement.givenNames));
      tr = document.createElement('tr');
      tr.style.lineHeight = '1';
      tr.style.fontSize = '90%';
      table.appendChild(tr);
      td = document.createElement('td');
      tr.appendChild(td);
      td.classList.add('citizen-label');
      if (endorsement.revoke) {
        td.style.color = 'red';
        td.style.fontWeight = 'bold';
      }
      td.appendChild(document.createTextNode(endorsement.revoke ? 'Revoked you on:' : 'Endorsed you on:'));
      td.style.paddingRight = '10px';
      td = document.createElement('td');
      tr.appendChild(td);
      let t = new Date(endorsement.published).toISOString().slice(0, 10);
      td.classList.add('citizen-date');
      td.appendChild(document.createTextNode(t));
    });
    */
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
      title: title,
      text: text,
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
          input.focus();
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
};
