import QrScanner from './qr-scanner.min.js';
QrScanner.WORKER_PATH = 'js/qr-scanner-worker.min.js';

window.onload = function() {
  const directdemocracy_version = '0.0.1';
  let croppie = null;
  let geolocation = false;
  let citizen = null;
  let citizen_fingerprint = '';
  let citizen_endorsements = [];
  let register_map = null;
  let register_marker = null;
  let endorsed = null;
  let endorse_map = null;
  let endorse_marker = null;
  let endorsed_fingerprint = '';
  let citizen_crypt = null;
  let private_key = '';
  let publisher = '';
  let trustee = '';
  let station = '';
  let station_key = '';
  let scanner = null;
  let endorsements = [];
  let votes = null;
  let ballots = null;
  let registrations = null;
  let referendums = null;

  function unix_time_to_text(unix_timestamp) {
    const a = new Date(unix_timestamp * 1000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours();
    const minute = '0' + a.getMinutes();
    const second = '0' + a.getSeconds();
    const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + minute.substr(-2) + ':' + second.substr(-2);
    return time;
  }

  function stripped_key(public_key) {
    let stripped = '';
    const header = '-----BEGIN PUBLIC KEY-----\n'.length;
    const footer = '-----END PUBLIC KEY-----'.length;
    const l = public_key.length - footer;
    for(let i = header; i < l; i += 65)
      stripped += public_key.substr(i, 64);
    stripped = stripped.slice(0, -1 - footer);
    return stripped;
  }

  function public_key(key) {
    let pkey = '-----BEGIN PUBLIC KEY-----\n';
    const l = key.length;
    for(let i = 0; i < l; i += 64)
      pkey += key.substr(i, 64) + '\n';
    pkey += '-----END PUBLIC KEY-----';
    return pkey;
  }

  function showModal(title, contents) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-contents').innerHTML = contents;
    $('#modal').modal();
  }

  function clearForms() {
    document.getElementById('edit-i-understand').value = '';
    document.getElementById('edit-button').setAttribute('disabled', '');
    document.getElementById('revoke-key-i-understand').value = '';
    document.getElementById('revoke-key-button').setAttribute('disabled', '');
    document.getElementById('register-confirm-check').checked = false;
    document.getElementById('publish-button').setAttribute('disabled', '');
    let d = new Date();
    d.setFullYear(d.getFullYear() + 10);
    document.getElementById('register-expiration').value = d.toISOString().slice(0, 10);
  }

  function getGeolocationPosition(position) {
    geolocation = true;
    citizen.latitude = Math.round(1000000 * position.coords.latitude);
    citizen.longitude = Math.round(1000000 * position.coords.longitude);
    register_map.setView([position.coords.latitude, position.coords.longitude], 12);
    setTimeout(function() {
      register_marker.setLatLng([citizen.latitude / 1000000, citizen.longitude / 1000000]);
      updateLocation();
    }, 500);
  }

  function setupMap() {
    if (register_map != null) return;
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(getGeolocationPosition);
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
    const lat = citizen.latitude / 1000000;
    const lon = citizen.longitude / 1000000;
    register_map = L.map('register-map').setView([lat, lon], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(register_map);
    register_marker = L.marker([lat, lon]).addTo(register_map).bindPopup(lat + ',' + lon);
    updateLocation();
    register_map.on('contextmenu', function(event) { return false; });
    register_map.on('click', function onMapClick(e) {
      register_marker.setLatLng(e.latlng);
      citizen.latitude = Math.round(1000000 * e.latlng.lat);
      citizen.longitude = Math.round(1000000 * e.latlng.lng);
      updateLocation();
    });
  }

  function updateLocation() {
    const lat = citizen.latitude / 1000000;
    const lon = citizen.longitude / 1000000;
    register_marker.setPopupContent(lat + ',' + lon).openPopup();
    document.getElementById('register-latitude').value = lat;
    document.getElementById('register-longitude').value = lon;
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const a = JSON.parse(this.responseText);
        const address = a.display_name;
        register_marker.setPopupContent(address + '<br><br><center style="color:#999">('
         + lat + ', ' + lon + ')</center>').openPopup();
        document.getElementById('register-address').innerHTML = address;
      }
    };
    xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon, true);
    xhttp.send();
  }

  function updateRegistrationForm() {
    document.getElementById('register-picture').src = citizen.picture;
    document.getElementById('register-family-name').value = citizen.familyName;
    document.getElementById('register-given-names').value = citizen.givenNames;
    document.getElementById('register-latitude').value = citizen.latitude;
    document.getElementById('register-longitude').value = citizen.longitude;
  }

  function updateCitizenCard() {
    document.getElementById('citizen-picture').setAttribute('src', citizen.picture);
    document.getElementById('citizen-family-name').innerHTML = citizen.familyName;
    document.getElementById('citizen-given-names').innerHTML = citizen.givenNames;
    document.getElementById('citizen-coords').innerHTML = '<a target="_blank" href="https://openstreetmap.org/?mlat='
     + citizen.latitude / 1000000 + '&mlon=' + citizen.longitude / 1000000 + '&zoom=12">' + citizen.latitude / 1000000 + ', '
     + citizen.longitude / 1000000 + '</a>';
    let published = new Date(citizen.published);
    let expires = new Date(citizen.expires);
    document.getElementById('citizen-published').innerHTML = published.toISOString().slice(0, 10);
    document.getElementById('citizen-expires').innerHTML = expires.toISOString().slice(0, 10);
    citizen_fingerprint = CryptoJS.SHA1(citizen.signature).toString();
    let qr = new QRious({
      element: document.getElementById('citizen-qr-code'),
      value: citizen_fingerprint,
      level: 'M',
      size: 200,
      padding: 13
    });
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
      img.style.width='45px';
      img.style.height='60px';
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
  }

  function checkExpirationValidity() {
    let expiration = document.getElementById('register-expiration');
    const choice = new Date(expiration.value + 'T00:00:00Z');
    const min = new Date();
    let max = new Date();
    max.setFullYear(max.getFullYear() + 10);
    if (choice > max || choice < min) {
      expiration.setCustomValidity('Please enter a date between tomorrow and 10 year from now.');
      return false;
    }
    expiration.setCustomValidity('');
    return true;
  }

  function generateNewKeyPair() {
    document.getElementById('register-forging-spinner').style.display = '';
    document.getElementById('register-private-key-icon').style.display = 'none';
    document.getElementById('register-private-key-message').innerHTML = 'Forging a new private key, please wait...';
    let dt = new Date();
    let time = -(dt.getTime());
    citizen_crypt = new JSEncrypt({
      default_key_size: 2048
    });
    citizen_crypt.getKey(function() {
      dt = new Date();
      time += (dt.getTime());
      citizen.key = stripped_key(citizen_crypt.getPublicKey());
      private_key = citizen_crypt.getPrivateKey();
      document.getElementById('register-forging-spinner').style.display = 'none';
      document.getElementById('register-private-key-icon').style.display = '';
      document.getElementById('register-private-key-message').innerHTML = 'You new private key was just forged in '
                                                                        + Number(time / 1000).toFixed(2) + ' seconds.';
      validate();
    });
  }

  function validate() {
    let button = document.getElementById('publish-button');
    button.setAttribute('disabled', '');
    if (citizen.key === '' || citizen.picture === '') return;
    if (citizen.latitude === 0 && citizen.longitude === 0) return;
    citizen.familyName = document.getElementById('register-family-name').value.trim();
    if (citizen.familyName === '') return;
    citizen.givenNames = document.getElementById('register-given-names').value.trim();
    if (citizen.givenNames === '') return;
    if (!document.getElementById('register-confirm-check').checked) return;
    if (!checkExpirationValidity()) return;
    button.removeAttribute('disabled');
  }
  document.getElementById('register-family-name').addEventListener('input', validate);
  document.getElementById('register-given-names').addEventListener('input', validate);
  document.getElementById('register-expiration').addEventListener('input', validate);
  document.getElementById('register-confirm-check').addEventListener('input', validate);

  function uploadPicture() {
    document.getElementById('register-picture-upload').click();
  }
  document.getElementById('register-upload-button').addEventListener('click', uploadPicture);
  document.getElementById('register-picture').addEventListener('click', uploadPicture);

  document.getElementById('register-picture-upload').addEventListener('change', function(event) {
    if (croppie) croppie.destroy();
    let img = document.getElementById('register-picture');
    img.src = URL.createObjectURL(event.target.files[0]);
    event.target.value = '';
    croppie = new Croppie(img, {
      boundary: {
        width: 250,
        height: 300
      },
      viewport: {
        width: 150,
        height: 200
      },
      enableExif: true
    });
    document.getElementById('picture-select').style.display = '';
  });

  document.getElementById('picture-select').addEventListener('click', function() {
    croppie.result({
      type: 'base64',
      format: 'jpeg',
      quality: 0.95
    }).then(function(result) {
      document.getElementById('register-picture').setAttribute('src', result);
      citizen.picture = result;
      document.getElementById('picture-select').style.display = 'none';
      croppie.destroy();
      croppie = null;
      validate();
    });
    return false;
  });

  document.getElementById('publish-button').addEventListener('click', function() {
    citizen.schema = 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/citizen.schema.json';
    citizen.published = new Date().getTime();
    citizen.expires = new Date(document.getElementById('register-expiration').value + 'T00:00:00Z').getTime();
    citizen.signature = '';
    citizen.signature = citizen_crypt.sign(JSON.stringify(citizen), CryptoJS.SHA256, 'sha256');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Publication error', JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          localStorage.setItem('privateKey', private_key);
          updateCitizenCard();
          document.getElementById('citizen-nav').style.display = '';
          document.getElementById('endorsements-nav').style.display = '';
          document.getElementById('register-nav').style.display = 'none';
          document.getElementById('revoke-key').removeAttribute('disabled');
          document.getElementById('edit').removeAttribute('disabled');
          $('.nav-tabs a[href="#citizen"]').tab('show');
          showModal('Publication success', 'Your citizen card was just published!<br>Check it <a target="_blank" href="'
          + publisher + '/publication.php?fingerprint=' + answer.fingerprint + '">here</a>.<br>');
        }
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(citizen));
    return false;
  });

  document.getElementById('publisher').addEventListener('input', function() {
    publisher = document.getElementById('publisher').value.trim();
    localStorage.setItem('publisher', publisher);
  });

  document.getElementById('trustee').addEventListener('input', function() {
    trustee = document.getElementById('trustee').value.trim();
    localStorage.setItem('trustee', trustee);
  });

  document.getElementById('station').addEventListener('input', function() {
    station = document.getElementById('station').value.trim();
    localStorage.setItem('station', station);
  });

  document.getElementById('edit-i-understand').addEventListener('input', function() {
    document.getElementById('edit-button').disabled = (document.getElementById('edit-i-understand').value != 'I understand');
  });

  document.getElementById('revoke-key-i-understand').addEventListener('input', function() {
    document.getElementById('revoke-key-button').disabled = (document.getElementById('revoke-key-i-understand').value != 'I understand');
  });

  document.getElementById('revoke-citizen-i-understand').addEventListener('input', function() {
    document.getElementById('revoke-citizen-button').disabled = (document.getElementById('revoke-citizen-i-understand').value != 'I understand');
  });

  $('#modal-revoke-key').on('hidden.bs.modal', function() {
    document.getElementById('revoke-key-i-understand').value = '';
    document.getElementById('revoke-key-button').disabled = 'disabled';
  });

  $('#modal-revoke-citizen').on('hidden.bs.modal', function() {
    document.getElementById('revoke-citizen-i-understand').value = '';
    document.getElementById('revoke-citizen-button').disabled = 'disabled';
  });

  $('#modal-edit').on('hidden.bs.modal', function() {
    document.getElementById('edit-i-understand').value = '';
    document.getElementById('edit-button').disabled = 'disabled';
  });

  document.getElementById('edit').addEventListener('click', function() {
    $('#modal-edit').modal();
  });

  document.getElementById('revoke-key').addEventListener('click', function() {
    $('#modal-revoke-key').modal();
  });

  document.getElementById('edit-button').addEventListener('click', function() {
    document.getElementById('citizen-nav').style.display = 'none';
    document.getElementById('endorsements-nav').style.display = 'none';
    document.getElementById('register-nav').style.display = '';
    document.getElementById('edit-i-understand').value = '';
    document.getElementById('edit').setAttribute('disabled', '');
    setupMap();
    $('.nav-tabs a[href="#register"]').tab('show');
    clearForms();
    $('#modal-edit').modal('hide');
    updateRegistrationForm();
  });

  document.getElementById('revoke-key-button').addEventListener('click', function() {
    document.getElementById('revoke-key-i-understand').value = '';
    document.getElementById('revoke-key-button').setAttribute('disabled', '');
    let endorsement = {
      schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/endorsement.schema.json',
      key: citizen.key,
      signature: '',
      published: new Date().getTime(),
      expires: citizen.expires,
      revoke: true,
      publication: {
        key: citizen.key,
        signature: citizen.signature
      }
    };
    endorsement.signature = citizen_crypt.sign(JSON.stringify(endorsement), CryptoJS.SHA256, 'sha256');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error) {
          $('#modal-revoke-key').modal('hide');
          showModal('Revocation error', JSON.stringify(answer.error) + '.<br>Please try again.');
        } else {
          window.localStorage.removeItem('privateKey');
          private_key = '';
          citizen.key = '';
          generateNewKeyPair();
          document.getElementById('citizen-nav').style.display = 'none';
          document.getElementById('endorsements-nav').style.display = 'none';
          document.getElementById('register-nav').style.display = '';
          document.getElementById('edit').setAttribute('disabled', '');
          document.getElementById('revoke-key').setAttribute('disabled', '');
          setupMap();
          $('.nav-tabs a[href="#register"]').tab('show');
          clearForms();
          $('#modal-revoke-key').modal('hide');
          showModal('Revocation success', 'Your private key was successfully revoked.');
          updateRegistrationForm();
        }
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(endorsement));
  });

  document.getElementById('endorse-button').addEventListener('click', function() {
    const button = document.getElementById('endorse-button');
    const video = document.getElementById('endorse-qr-video');
    const list = document.getElementById('endorsements-list');
    if (scanner) {  // Cancel pressed
      button.innerHTML = 'Endorse a Citizen';
      button.removeAttribute('disabled');
      video.style.display = 'none';
      list.style.display = '';
      scanner.destroy();
      scanner = null;
      return;
    }
    const message = document.getElementById('endorse-message');
    function setResult(fingerprint) {
      const pattern = /^[0-9a-f]{40}$/g;
      if (!pattern.test(fingerprint)) {
        message.innerHTML = 'Wrong QR code reading: <b>' + fingerprint + '</b>';
        setTimeout(function() {
          message.innerHTML = '';
        }, 10000);
        return;
      }
      if (fingerprint == citizen_fingerprint) {
        message.innerHTML = 'You should not endorse yourself!';
        setTimeout(function() {
          message.innerHTML = '';
        }, 10000);
        return;
      }
      message.innerHTML = 'Found fingerprint: <br>' + fingerprint + '</b>';
      endorsed_fingerprint = fingerprint;
      scanner.destroy();
      scanner = null;
      video.style.display = 'none';
      list.style.display = '';
      button.setAttribute('disabled', '');
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          endorsed = JSON.parse(this.responseText);
          if (endorsed.hasOwnProperty('error')) {
            message.innerHTML = endorsed.error;
            setTimeout(function() {
              message.innerHTML = '';
            }, 10000);
            return;
          }
          // verify signature of endorsed
          let signature = endorsed.signature;
          endorsed.signature = '';
          let verify = new JSEncrypt();
          verify.setPublicKey(public_key(endorsed.key));
          if (!verify.verify(JSON.stringify(endorsed), signature, CryptoJS.SHA256)) {
            message.innerHTML = 'Cannot verify citizen signature';
            setTimeout(function() {
              message.innerHTML = '';
            }, 10000);
            return;
          }
          endorsed.signature = signature;
          message.innerHTML = '';
          document.getElementById('endorse-button-group').style.display = 'none';
          document.getElementById('endorse-citizen').style.display = '';
          document.getElementById('endorse-picture').src = endorsed.picture;
          document.getElementById('endorse-family-name').innerHTML = endorsed.familyName;
          document.getElementById('endorse-given-names').innerHTML = endorsed.givenNames;
          document.getElementById('endorse-coords').innerHTML = endorsed.latitude + ', ' + endorsed.longitude;
          let published = new Date(endorsed.published);
          let expires = new Date(endorsed.expires);
          document.getElementById('endorse-published').innerHTML = published.toISOString().slice(0, 10);
          document.getElementById('endorse-expires').innerHTML = expires.toISOString().slice(0, 10);
          const lat = endorsed.latitude / 1000000;
          const lon = endorsed.longitude / 1000000;
          if (endorse_map == null) {
            endorse_map = L.map('endorse-map');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(endorse_map);
            endorse_marker = L.marker([lat, lon]).addTo(endorse_map);
          } else
            endorse_marker.setLatLng([lat, lon]);
          endorse_marker.bindPopup(lat + ', ' + lon);
          endorse_map.setView([lat, lon], 18);
          endorse_map.on('contextmenu', function(event) { return false; });
          let xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              const a = JSON.parse(this.responseText);
              const address = a.display_name;
              endorse_marker.setPopupContent(address + '<br><br><center style="color:#999">('
               + lat + ', ' + lon + ')</center>').openPopup();
            }
          };
          xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon, true);
          xhttp.send();
        }
      };
      xhttp.open('GET', publisher + '/publication.php?fingerprint=' + fingerprint, true);
      xhttp.send();
    }
    video.style.display = '';
    list.style.display = 'none';
    button.innerHTML = 'Cancel';
    scanner = new QrScanner(video, fingerprint => setResult(fingerprint));
    scanner.start();
  });

  function checkEndorse() {
    let button = document.getElementById('endorse');
    if (document.getElementById('endorse-picture-check').checked &&
        document.getElementById('endorse-name-check').checked &&
        document.getElementById('endorse-coords-check').checked)
      button.removeAttribute('disabled');
    else
      button.setAttribute('disabled', '');
  }
  document.getElementById('endorse-picture-check').addEventListener('change', checkEndorse);
  document.getElementById('endorse-name-check').addEventListener('change', checkEndorse);
  document.getElementById('endorse-coords-check').addEventListener('change', checkEndorse);

  function clearEndorseChecks() {
    document.getElementById('endorse-picture-check').checked = false;
    document.getElementById('endorse-name-check').checked = false;
    document.getElementById('endorse-coords-check').checked = false;
    document.getElementById('endorse').setAttribute('disabled', '');
  }

  function clearEndorse() {
    let button = document.getElementById('endorse-button');
    button.innerHTML = 'Endorse a Citizen';
    button.removeAttribute('disabled');
    document.getElementById('endorse-button-group').style.display = '';
    document.getElementById('endorse-citizen').style.display = 'none';
    clearEndorseChecks();
  }

  document.getElementById('endorse-cancel').addEventListener('click', clearEndorse);

  document.getElementById('endorse').addEventListener('click', function() {
    document.getElementById('endorse-button').setAttribute('disabled', '');
    document.getElementById('endorse-cancel').setAttribute('disabled', '');
    let endorsement = {
      schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/endorsement.schema.json',
      key: citizen.key,
      signature: '',
      published: new Date().getTime(),
      expires: endorsed.expires,
      publication: {
        key: endorsed.key,
        signature: endorsed.signature
      }
    };
    endorsement.signature = citizen_crypt.sign(JSON.stringify(endorsement), CryptoJS.SHA256, 'sha256');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Endorsement error', JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          showModal('Endorsement success', 'You successfully endorsed ' + endorsed.givenNames + ' ' + endorsed.familyName);
          endorsements = answer;
          updateEndorsements();
        }
        clearEndorse();
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(endorsement));
  });

  function updateEndorsements() {
    let list = document.getElementById('endorsements-list');
    list.innerHTML = '';  // clear
    let table = document.createElement('table');
    table.setAttribute('id', 'endorsements-table');
    table.classList.add('table');
    table.style.width = '100%';
    table.style.maxWidth = '400px';
    list.appendChild(table);
    endorsements.forEach(function(endorsement) {
      let tr = document.createElement('tr');
      table.appendChild(tr);
      if (endorsement.revoke)
        tr.classList.add('revoked');
      let td = document.createElement('td');
      tr.appendChild(td);
      let img = document.createElement('img');
      td.setAttribute('rowspan', endorsement.revoke ? '2' : '3');
      td.appendChild(img);
      img.src = endorsement.picture;
      img.style.width='45px';
      img.style.height='60px';
      td = document.createElement('td');
      if (endorsement.revoke)
        td.style.fontStyle = 'italic';
      td.setAttribute('colspan', '3');
      tr.appendChild(td);
      let a = document.createElement('a');
      td.appendChild(a);
      a.href = publisher + '/publication.php?fingerprint=' + CryptoJS.SHA1(endorsement.signature).toString();
      a.target = '_blank';
      let b = document.createElement('b');
      b.appendChild(document.createTextNode(endorsement.familyName));
      a.appendChild(b);
      a.appendChild(document.createTextNode(' ' + endorsement.givenNames));
      tr = document.createElement('tr');
      if (endorsement.revoke)
        tr.classList.add('revoked');
      tr.style.lineHeight = '1';
      tr.style.fontSize = '90%';
      table.appendChild(tr);
      td = document.createElement('td');
      tr.appendChild(td);
      td.classList.add('citizen-label');
      td.appendChild(document.createTextNode(endorsement.revoke ? 'Revoked:' : 'Endorsed:'));
      td.style.paddingRight = '10px';
      td = document.createElement('td');
      tr.appendChild(td);
      let t = new Date(endorsement.published).toISOString().slice(0, 10);
      td.classList.add('citizen-date');
      td.appendChild(document.createTextNode(t));
      td = document.createElement('td');
      td.setAttribute('rowspan', endorsement.revoke ? '1' : '2');
      td.style.verticalAlign = 'middle';
      td.style.textAlign = 'center';
      td.style.width = '50px';
      tr.appendChild(td);
      let button = null;
      if (!endorsement.revoke) {
        button = document.createElement('button');
        button.classList.add('btn');
        button.classList.add('btn-danger');
        button.appendChild(document.createTextNode('Revoke'));
        td.appendChild(button);
      }
      tr = document.createElement('tr');
      if (endorsement.revoke)
        tr.style.display = 'none';
      tr.style.lineHeight = '1';
      tr.style.fontSize = '90%';
      table.appendChild(tr);
      td = document.createElement('td');
      tr.appendChild(td);
      td.classList.add('citizen-label');
      td.appendChild(document.createTextNode('Expires:'));
      td.style.paddingRight = '10px';
      td = document.createElement('td');
      tr.appendChild(td);
      t = new Date(endorsement.expires).toISOString().slice(0, 10);
      td.classList.add('citizen-date');
      tr.style.lineHeight = '1';
      td.appendChild(document.createTextNode(t));
      if (!endorsement.revoke)
        button.addEventListener('click', function() {
          document.getElementById('revoke-citizen-name').innerHTML = endorsement.givenNames + ' ' + endorsement.familyName;
          function revoke() {
            document.getElementById('revoke-citizen-button').removeEventListener('click', revoke);
            let e = {
              schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/endorsement.schema.json',
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
            e.signature = citizen_crypt.sign(JSON.stringify(e), CryptoJS.SHA256, 'sha256');
            let xhttp = new XMLHttpRequest();
            xhttp.onload = function() {
              if (this.status == 200) {
                $('#modal-revoke-citizen').modal('hide');
                let answer = JSON.parse(this.responseText);
                if (answer.error)
                  showModal('Revocation error', JSON.stringify(answer.error) + '.<br>Please try again.');
                else {
                  showModal('Revocation success', 'You successfully revoked ' + endorsement.givenNames + ' ' + endorsement.familyName);
                  endorsements = answer;
                  updateEndorsements();
                }
              }
            };
            xhttp.open('POST', publisher + '/publish.php', true);
            xhttp.send(JSON.stringify(e));
          }
          document.getElementById('revoke-citizen-button').addEventListener('click', revoke);
          $('#modal-revoke-citizen').modal();
        });
    });
  }
  function updateVote() {
    let xhttp = new XMLHttpRequest();
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
                      'country'];
        admin.forEach(function(item) {
          addAdminLevel(item);
        });
        const country_code = address.country_code.toUpperCase();
        if (['GB', 'DE', 'FR', 'IT', 'SE', 'PL', 'RO', 'HR', 'ES', 'NL', 'IE', 'BG', 'DK', 'GR',
             'AT', 'HU', 'FI', 'CZ', 'PT', 'BE', 'MT', 'CY', 'LU', 'SI', 'LU', 'SK', 'EE', 'LV']
            .indexOf(country_code) >= 0) {
          type.push('union');
          name.push('European Union');
        }
        let area = '';
        name.forEach(function(n, i) {
          area += type[i] + '=' + name[i] + '\n';
        });
        let xhttp = new XMLHttpRequest();
        xhttp.onload = function() {
          if (this.status == 200) {
            referendums = JSON.parse(this.responseText);
            let accordion = document.getElementById('vote-accordion');
            if (referendums.length == 0) {
              accordion.innerHTML = 'No referendum is currently available in your area.';
              return;
            }
            accordion.innerHTML = '';
            referendums.forEach(function(referendum, index) {
              let vote = votes.find(vote => vote.referendum === referendum.key);
              if (vote === undefined) {
                vote = {
                  referendum: referendum.key
                };
                votes.push(vote);
              }
              if (!vote.hasOwnProperty('private') && !vote.hasOwnProperty('public')) {
                let crypt = new JSEncrypt({
                  default_key_size: 2048
                });
                crypt.getKey(function() {
                  vote.private = crypt.getPrivateKey();
                  localStorage.setItem('votes', JSON.stringify(votes));
                  updateVoteKey(index, vote);
                });
              }
              let card = document.createElement('div');
              card.setAttribute('class', 'card');
              let header = document.createElement('div');
              header.setAttribute('class', 'card-header d-flex');
              card.appendChild(header);
              let link = document.createElement('a');
              link.setAttribute('class', 'card-link');
              link.setAttribute('data-toggle', 'collapse');
              link.setAttribute('href', '#collapse' + index);
              link.innerHTML = referendum.title;
              header.appendChild(link);
              let area_div = document.createElement('div');
              area_div.setAttribute('class', 'ml-auto');
              let days = Math.round((referendum.deadline - new Date().getTime()) / 86400000);
              const first_equal = referendum.area.indexOf('=');
              const first_newline = referendum.area.indexOf('\n');
              let area_name = referendum.area.substr(first_equal + 1, first_newline - first_equal);
              let area_type = referendum.area.substr(0, first_equal);
              const area_array = referendum.area.split('\n');
              let area_query = '';
              area_array.forEach(function(argument) {
                const eq = argument.indexOf('=');
                const type = argument.substr(0, eq);
                const name = argument.substr(eq + 1);
                if (type)
                  area_query += type + '=' + encodeURIComponent(name) + '&';
              });
              area_query = area_query.slice(0, -1);
              let area_url;
              if (!area_type) {
                area_type = 'world';
                area_name = 'Earth';
                area_url = 'https://en.wikipedia.org/wiki/Earth';
              } else if (area_type == 'union')
                area_url = 'https://en.wikipedia.org/wiki/European_Union';
              else
                area_url = 'https://nominatim.openstreetmap.org/search.php?' + area_query + '&polygon_geojson=1';
              area_div.innerHTML = '<small>(' + days + 'd)</small> ' + area_name;
              header.appendChild(area_div);
              let collapse = document.createElement('div');
              collapse.setAttribute('id', 'collapse' + index);
              collapse.setAttribute('class', 'collapse');
              collapse.setAttribute('data-parent', '#vote-accordion');
              let body = document.createElement('div');
              body.setAttribute('class', 'card-body');
              let deadline = document.createElement('div');
              deadline.innerHTML = '<small><b>Deadline:</b> ' + unix_time_to_text(referendum.deadline / 1000)
                                 + ' &mdash; <b>Area:</b> <a target="_blank" href="' + area_url + '">' + area_name
                                 + '</a> (' + area_type + ')</small>';
              body.appendChild(deadline);
              body.appendChild(document.createElement('br'));
              let description = document.createElement('div');
              description.innerHTML = referendum.description;
              body.appendChild(description);
              body.appendChild(document.createElement('br'));
              let question = document.createElement('div');
              question.setAttribute('style', 'font-weight:bold');
              question.innerHTML = referendum.question;
              body.appendChild(question);
              collapse.appendChild(body);
              let footer = document.createElement('div');
              footer.setAttribute('class', 'card-footer');
              let button = document.createElement('button');
              button.setAttribute('class', 'btn btn-primary');
              button.setAttribute('type', 'button');
              button.setAttribute('id', 'vote-button-' + index);
              button.innerHTML = 'Vote';
              let vote_message = document.createElement('span');
              vote_message.style.marginLeft = '16px';
              vote_message .setAttribute('id', 'vote-message-' + index);
              const answers = referendum.answers.split('\n');
              let count = 0;
              answers.forEach(function(answer) {
                count++;
                let div = document.createElement('div');
                div.setAttribute('class', 'form-check');
                let input = document.createElement('input');
                input.setAttribute('class', 'form-check-input');
                input.setAttribute('type', 'radio');
                input.setAttribute('name', 'answer-' + index);
                input.setAttribute('id', 'answer-' + index + '-' + count);
                input.setAttribute('value', answer);
                input.addEventListener('click', function() { updateVoteKey(index, vote); });
                div.appendChild(input);
                let label = document.createElement('label');
                label.setAttribute('class', 'form-check-label');
                label.setAttribute('for', 'answer-' + index + '-' + count);
                label.innerHTML = answer;
                div.appendChild(label);
                footer.appendChild(div);
              });
              footer.appendChild(document.createElement('br'));
              footer.appendChild(button);
              footer.appendChild(vote_message);
              collapse.appendChild(footer);
              card.appendChild(collapse);
              accordion.appendChild(card);
              updateVoteKey(index, vote);
              button.addEventListener('click', function(event) {
                let button = event.target;
                button.innerHTML =
                  `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Voting...`;
                button.setAttribute('disabled', '');
                let xhttp = new XMLHttpRequest();
                xhttp.onload = function() {
                  if (this.status != 200) {
                    console.log('Station not responding: ' + this.status);
                    // FIXME: publish `RSba` message to cancel ballot and registration
                  } else {
                    let response = JSON.parse(this.responseText);
                    if (response.error) {
                      showModal('Register error', JSON.stringify(response.error));
                      return;
                    }
                    if (!response.hasOwnProperty('ballot')) {
                      showModal('Register error', 'Missing ballot in station response.');
                      return;
                    }
                    if (!response.hasOwnProperty('registration')) {
                      showModal('Register error', 'Missing registration in station response.');
                      return;
                    }
                    let ballot = response.ballot;
                    let registration = response.registration;
                    // verify the key of the ballot didn't change.
                    let verify = new JSEncrypt();
                    verify.setPrivateKey(vote.private);
                    if (!ballot.hasOwnProperty('key')) {
                      showModal('Register error', 'Missing key in ballot.');
                      return;
                    }
                    if (ballot.key != stripped_key(verify.getPublicKey())) {
                      showModal('Register error', 'Wrong ballot key.');
                      return;
                    }
                    // verify the station signature in the ballot
                    if (!ballot.hasOwnProperty('station')) {
                      showModal('Register error', 'Missing station in ballot.');
                      return;
                    }
                    if (!ballot.station.hasOwnProperty('key')) {
                      showModal('Register error', 'Missing station key in ballot.');
                      return;
                    }
                    const ballot_station_signature = ballot.station.signature;
                    delete ballot.station.signature;
                    verify = new JSEncrypt();
                    verify.setPublicKey(public_key(ballot.station.key));
                    if (!verify.verify(JSON.stringify(ballot), ballot_station_signature, CryptoJS.SHA256)) {
                      showModal('Register error', 'Wrong station signature for ballot.');
                      return;
                    }
                    // verify the ballot signature
                    if (!ballot.hasOwnProperty('signature')) {
                      showModal('Register error', 'Missing signature in ballot.');
                      return;
                    }
                    const ballot_signature = ballot.signature;
                    ballot.signature = '';
                    verify = new JSEncrypt();
                    verify.setPublicKey(public_key(ballot.key));
                    if (!verify.verify(JSON.stringify(ballot), ballot_signature, CryptoJS.SHA256)) {
                      showModal('Register error', 'Wrong ballot signature.');
                      return;
                    }
                    // restore signatures
                    ballot.signature = ballot_signature;
                    ballot.station.signature = ballot_station_signature;
                    // verify the key of the registration didn't change
                    if (!registration.hasOwnProperty('key')) {
                      showModal('Register error', 'Missing key in registration.');
                      return;
                    }
                    if (registration.key != citizen.key) {
                      showModal('Register error', 'The key in registration is wrong.');
                      return;
                    }
                    // verify the station signature in the registration
                    if (!registration.hasOwnProperty('station')) {
                      showModal('Register error', 'Missing station in registration.');
                      return;
                    }
                    if (!registration.station.hasOwnProperty('key')) {
                      showModal('Register error', 'Missing station key in registration.');
                      return;
                    }
                    const registration_station_signature = registration.station.signature;
                    delete registration.station.signature;
                    verify = new JSEncrypt();
                    verify.setPublicKey(public_key(registration.station.key));
                    if (!verify.verify(JSON.stringify(registration), registration_station_signature, CryptoJS.SHA256)) {
                      showModal('Register error', 'Wrong station signature for registration.');
                      return;
                    }
                    // verify the registration signature
                    if (!registration.hasOwnProperty('signature')) {
                      showModal('Register error', 'Missing signature in registration.');
                      return;
                    }
                    const registration_signature = registration.signature;
                    registration.signature = '';
                    verify = new JSEncrypt();
                    verify.setPublicKey(public_key(registration.key));
                    if (!verify.verify(JSON.stringify(registration), registration_signature, CryptoJS.SHA256)) {
                      showModal('Register error', 'Wrong registration signature.');
                      return;
                    }
                    // restore signatures
                    registration.signature = registration_signature;
                    registration.station.signature = registration_station_signature;
                    // check match between ballot and registration
                    if (!ballot.hasOwnProperty('referendum')) {
                      showModal('Register error', 'Missing referendum in ballot.');
                      return;
                    }
                    if (!registration.hasOwnProperty('referendum')) {
                      showModal('Register error', 'Missing referendum in registration.');
                      return;
                    }
                    if (ballot.referendum != registration.referendum) {
                      showModal('Register error', 'Mismatching referendum in ballot and registration.');
                      return;
                    }
                    if (ballot.station.key != registration.station.key) {
                      showModal('Register error', 'Mismatching referendum in ballot and registration.');
                      return;
                    }
                    // save ballot and registration (can be a proof against cheating station)
                    ballots.push(ballot);
                    registrations.push(registration);
                    localStorage.setItem('ballots', JSON.stringify(ballots));
                    localStorage.setItem('registrations', JSON.stringify(registrations));
                    // proceed to vote
                    vote_message.innerHTML = "Registration success";
                    let radios = document.getElementsByName('answer-' + index);
                    let answer = '';
                    for(let i = 0, length = radios.length; i < length; i++)
                      if (radios[i].checked) {
                        answer = radios[i].value;
                        break;
                      }
                    console.log("voting: " + answer);
                    let crypt = new JSEncrypt();
                    crypt.setPrivateKey(vote.private);
                    let my_vote = {
                      schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/vote.schema.json',
                      key: stripped_key(crypt.getPublicKey()),
                      signature: '',
                      published: referendum.deadline,
                      expires: referendum.deadline + 10 * 365.25 * 24 * 60 * 60 * 1000,  // 10 years
                      answer: answer
                    };
                    my_vote.signature = crypt.sign(JSON.stringify(my_vote), CryptoJS.SHA256, 'sha256');
                    let xhttp = new XMLHttpRequest();
                    xhttp.onload = function() {
                      if (this.status == 200) {
                        let response = JSON.parse(this.responseText);
                        if (response.error) {
                          showModal('Vote error', JSON.stringify(response.error));
                          return;
                        }
                        console.log("Vote fingerprint: " + response.fingerprint);
                        button.innerHTML = 'Voted';
                        button.setAttribute('class', 'btn btn-success');
                        const now = Math.round(new Date().getTime() / 1000);
                        vote_message.innerHTML = unix_time_to_text(now);
                        delete vote.private;
                        vote.public = stripped_key(crypt.getPublicKey());
                        vote.date = now;
                        localStorage.setItem('votes', JSON.stringify(votes));
                      }
                    };
                    xhttp.open('POST', publisher + '/publish.php', true);
                    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhttp.send(JSON.stringify(my_vote));
                  }
                };
                let crypt = new JSEncrypt();
                crypt.setPrivateKey(vote.private);
                let ballot = {
                  schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/ballot.schema.json',
                  key: stripped_key(crypt.getPublicKey()),
                  signature: '',
                  published: referendum.deadline,
                  expires: referendum.deadline + 1 * 365.25 * 24 * 60 * 60 * 1000,  // 1 year
                  referendum: referendum.key,
                  station: {
                    key: station_key
                  }
                };
                ballot.signature = crypt.sign(JSON.stringify(ballot), CryptoJS.SHA256, 'sha256');
                ballot.citizen = {
                  key: citizen.key
                };
                ballot.citizen.signature = citizen_crypt.sign(JSON.stringify(ballot), CryptoJS.SHA256, 'sha256');
                const now = new Date().getTime();
                let registration = {
                  schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/registration.schema.json',
                  key: citizen.key,
                  signature: '',
                  published: now,
                  expires: now + 10 * 365.25 * 24 * 60 * 60 * 1000,  // 1 year
                  referendum: referendum.key,
                  station: {
                    key: station_key
                  }
                };
                registration.signature = citizen_crypt.sign(JSON.stringify(registration), CryptoJS.SHA256, 'sha256');
                let request = {
                  ballot: ballot,
                  registration: registration
                };
                xhttp.open('POST', station + '/register.php', true);
                xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhttp.send(JSON.stringify(request));
              });
            });
            $('.collapse').collapse('hide');
          }
        };
        xhttp.open('POST', publisher + '/referendum.php', true);
        xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhttp.send('area=' + encodeURIComponent(area));
      }
    };
    let lat = citizen.latitude / 1000000;
    let lon = citizen.longitude / 1000000;
    xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon, true);
    xhttp.send();
  }
  function updateVoteKey(index, vote) {
    let button = document.getElementById('vote-button-' + index);
    let message = document.getElementById('vote-message-' + index);
    if (button === null || message === null)
      return;
    if (station_key === '') {
      message.innerHTML = 'Getting station key...';
      button.setAttribute('disabled', '');
    }
    else if (vote.hasOwnProperty('private')) {
      message.innerHTML = 'Think twice before you vote, afterwards no change is possible.';
      if (document.querySelector('input[name="answer-' + index + '"]:checked'))
        button.removeAttribute('disabled');
      else
        button.setAttribute('disabled', '');
    } else {
      button.setAttribute('disabled', '');
      if (vote.hasOwnProperty('public')) {
        button.setAttribute('class', 'btn btn-success');
        button.innerHTML = 'Voted';
        message.innerHTML = unix_time_to_text(vote.date);
        let radios = document.getElementsByName('answer-' + index);
        let answer = '';
        for(let i = 0, length = radios.length; i < length; i++)
          if (radios[i].checked) {
            answer = radios[i].value;
            break;
          }
        const now = new Date().getTime();
        if (answer == '' && referendums[index].deadline < now) {  // query publisher to get verification
          let xhttp = new XMLHttpRequest();
          xhttp.onload = function() {
            if (this.status == 200) {
              let response = JSON.parse(this.responseText);
              if (response.error)
                showModal('Vote verification error', JSON.stringify(response.error));
              else {
                answer = response.answer;
                for(let i = 0, length = radios.length; i < length; i++)
                  if (radios[i].value == answer) {
                    radios[i].checked = true;
                    break;
                  }
              }
            }
          };
          xhttp.open('POST', publisher + '/publication.php', true);
          xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhttp.send('key=' + encodeURIComponent(vote.public));
        }
      } else
        message.innerHTML = 'forging key for this vote, please wait...';
    }
  }
  clearForms();
  clearEndorseChecks();
  $('.nav-tabs').on('shown.bs.tab', function(event) {
    if (register_map) register_map.invalidateSize();
  });
  publisher = localStorage.getItem('publisher');
  if (!publisher) {
    publisher = 'https://publisher.directdemocracy.vote';
    localStorage.setItem('publisher', publisher);
  }
  document.getElementById('publisher').value = publisher;
  trustee = localStorage.getItem('trustee');
  if (!trustee) {
    trustee = 'https://trustee.directdemocracy.vote';
    localStorage.setItem('trustee', trustee);
  }
  document.getElementById('trustee').value = trustee;
  station = localStorage.getItem('station');
  if (!station) {
    station = 'https://station.directdemocracy.vote';
    localStorage.setItem('station', station);
  }
  document.getElementById('station').value = station;
  if (station) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Station key', JSON.stringify(answer.error));
        else {
          station_key = answer.key;
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

  votes = JSON.parse(localStorage.getItem('votes'));
  if (votes === null)
    votes = [];
  ballots = JSON.parse(localStorage.getItem('ballots'));
  if (ballots === null)
    ballots = [];
  registrations = JSON.parse(localStorage.getItem('registrations'));
  if (registrations === null)
    registrations = [];

  private_key = localStorage.getItem('privateKey');
  if (private_key) {
    citizen_crypt = new JSEncrypt();
    citizen_crypt.setPrivateKey(private_key);
    document.getElementById('register-forging-spinner').style.display = 'none';
    document.getElementById('register-private-key-icon').style.display = '';
    document.getElementById('register-private-key-message').innerHTML = 'Using your existing private key.';
    document.getElementById('register-nav').style.display = 'none';
    $('.nav-tabs a[href="#citizen"]').tab('show');
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Citizen error', JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          citizen = answer.citizen;
          citizen.key = stripped_key(citizen_crypt.getPublicKey());
          endorsements = answer.endorsements;
          citizen_endorsements = answer.citizen_endorsements;
          updateCitizenCard();
          updateEndorsements();
          updateVote();
        }
      }
    };
    xhttp.open('POST', publisher + '/citizen.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('key=' + encodeURIComponent(stripped_key(citizen_crypt.getPublicKey())));
  } else {
    generateNewKeyPair();
    document.getElementById('citizen-nav').style.display = 'none';
    document.getElementById('endorsements-nav').style.display = 'none';
    document.getElementById('revoke-key').setAttribute('disabled', '');
    document.getElementById('edit').setAttribute('disabled', '');
    $('.nav-tabs a[href="#register"]').tab('show');
    citizen = {
      schema: 'https://directdemocracy.vote/json-schema/' + directdemocracy_version + '/citizen.schema.json',
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
    setupMap();
  }
};
