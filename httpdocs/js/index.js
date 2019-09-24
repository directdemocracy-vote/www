import QrScanner from './qr-scanner.min.js';
QrScanner.WORKER_PATH = 'js/qr-scanner-worker.min.js';

window.onload = function() {
  var croppie = null;
  var geolocation = false;
  var citizen = null;
  var citizen_fingerprint = '';
  var register_map = null;
  var register_marker = null;
  var endorsed = null;
  var endorse_map = null;
  var endorse_marker = null;
  var endorsed_fingerprint = '';
  var crypt = null;
  var privateKey = '';
  var publisher = '';
  var scanner = null;
  var endorsements = [];

  function showModal(title, contents) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-contents').innerHTML = contents;
    $('#modal').modal();
  }

  function clearForms() {
    document.getElementById('edit-i-understand').value = '';
    document.getElementById('edit-button').setAttribute('disabled', 'disabled');
    document.getElementById('revoke-key-i-understand').value = '';
    document.getElementById('revoke-key-button').setAttribute('disabled', 'disabled');
    document.getElementById('register-confirm-check').checked = false;
    document.getElementById('publish-button').setAttribute('disabled', 'disabled');
    var d = new Date();
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
    var xhttp = new XMLHttpRequest();
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
    var lat = citizen.latitude / 1000000;
    var lon = citizen.longitude / 1000000;
    register_map = L.map('register-map').setView([lat, lon], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(register_map);
    register_marker = L.marker([lat, lon]).addTo(register_map).bindPopup(lat + ',' + lon);
    updateLocation();
    register_map.on('click', function onMapClick(e) {
      register_marker.setLatLng(e.latlng);
      citizen.latitude = Math.round(1000000 * e.latlng.lat);
      citizen.longitude = Math.round(1000000 * e.latlng.lng);
      updateLocation();
    });
  }

  function updateLocation() {
    var lat = citizen.latitude / 1000000;
    var lon = citizen.longitude / 1000000;
    register_marker.setPopupContent(lat + ',' + lon).openPopup();
    document.getElementById('register-latitude').value = lat;
    document.getElementById('register-longitude').value = lon;
    validate();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var a = JSON.parse(this.responseText);
        register_marker.setPopupContent(a.address.Match_addr + '<br><br><center style="color:#999">('
         + lat + ', ' + lon + ')</center>').openPopup();
        document.getElementById('register-address').innerHTML = a.address.Match_addr;
      }
    };
    xhttp.open('GET', 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&featureTypes=&location=' + lon + ',' + lat, true);
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
    var qr = new QRious({
      element: document.getElementById('citizen-qr-code'),
      value: citizen_fingerprint,
      level: 'M',
      size: 200,
      padding: 13
    });
  }

  function checkExpirationValidity() {
    var expiration = document.getElementById('register-expiration');
    var choice = new Date(expiration.value + 'T00:00:00Z');
    var min = new Date();
    var max = new Date();
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
    var dt = new Date();
    var time = -(dt.getTime());
    crypt = new JSEncrypt({
      default_key_size: 2048
    });
    crypt.getKey(function() {
      dt = new Date();
      time += (dt.getTime());
      citizen.key = crypt.getPublicKey();
      privateKey = crypt.getPrivateKey();
      document.getElementById('register-forging-spinner').style.display = 'none';
      document.getElementById('register-private-key-icon').style.display = '';
      document.getElementById('register-private-key-message').innerHTML = 'You new private key was just forged in '
                                                                        + Number(time / 1000).toFixed(2) + ' seconds.';
      validate();
    });
  }

  function validate() {
    var button = document.getElementById('publish-button');
    button.setAttribute('disabled', 'disabled');
    if (citizen.key === '' || citizen.picture === '') return;
    if (citizen.latitude === 0 && citizen.longitude === 0) return;
    citizen.familyName = document.getElementById('register-family-name').value;
    if (citizen.familyName === '') return;
    citizen.givenNames = document.getElementById('register-given-names').value;
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
    citizen.published = new Date().getTime();
    citizen.expires = new Date(document.getElementById('register-expiration').value + 'T00:00:00Z').getTime();
    citizen.signature = '';
    var str = JSON.stringify(citizen);
    citizen.signature = crypt.sign(str, CryptoJS.SHA256, 'sha256');
    var xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Publication error', JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          localStorage.setItem('citizen', JSON.stringify(citizen));
          localStorage.setItem('privateKey', privateKey);
          updateCitizenCard();
          document.getElementById('citizen-nav').style.display = '';
          document.getElementById('endorsements-nav').style.display = '';
          document.getElementById('register-nav').style.display = 'none';
          document.getElementById('revoke-key').removeAttribute('disabled');
          document.getElementById('edit').removeAttribute('disabled');
          $('.nav-tabs a[href="#citizen"]').tab('show');
          showModal('Publication success', 'Your citizen card was published under number ' + answer.citizen
          + '.<br>Check it at <a target="_blank" href="' + publisher + '/publication.php?id=' + answer.citizen
          + '">' + publisher + '/publication.php?id=' + answer.citizen + '</a><br>');
        }
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(citizen));
    return false;
  });

  document.getElementById('publisher').addEventListener('input', function() {
    publisher = document.getElementById('publisher').value;
    localStorage.setItem('publisher', publisher);
  });

  document.getElementById('edit-i-understand').addEventListener('input', function() {
    document.getElementById('edit-button').disabled = (document.getElementById('edit-i-understand').value != 'I understand');
  });

  document.getElementById('revoke-key-i-understand').addEventListener('input', function() {
    document.getElementById('revoke-key-button').disabled = (document.getElementById('revoke-key-i-understand').value != 'I understand');
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
    document.getElementById('edit').setAttribute('disabled', 'disabled');
    setupMap();
    $('.nav-tabs a[href="#register"]').tab('show');
    clearForms();
    $('#modal-edit').modal('hide');
    updateRegistrationForm();
  });

  document.getElementById('revoke-key-button').addEventListener('click', function() {
    document.getElementById('revoke-key-i-understand').value = '';
    document.getElementById('revoke-key-button').setAttribute('disabled', 'disabled');
    let endorsement = {
      schema: 'https://directdemocracy.vote/json-schema/0.0.1/endorsement.schema.json',
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
    let str = JSON.stringify(endorsement);
    endorsement.signature = crypt.sign(str, CryptoJS.SHA256, 'sha256');
    var xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error) {
          $('#modal-revoke-key').modal('hide');
          showModal('Revocation error', JSON.stringify(answer.error) + '.<br>Please try again.');
        } else {
          window.localStorage.removeItem('privateKey');
          privateKey = '';
          citizen.key = '';
          generateNewKeyPair();
          localStorage.removeItem('citizen');
          document.getElementById('citizen-nav').style.display = 'none';
          document.getElementById('endorsements-nav').style.display = 'none';
          document.getElementById('register-nav').style.display = '';
          document.getElementById('edit').setAttribute('disabled', 'disabled');
          document.getElementById('revoke-key').setAttribute('disabled', 'disabled');
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
      button.setAttribute('disabled', 'disabled');
      var xhttp = new XMLHttpRequest();
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
          verify.setPublicKey(endorsed.key);
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
          var lat = endorsed.latitude / 1000000;
          var lon = endorsed.longitude / 1000000;
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
          var xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              var a = JSON.parse(this.responseText);
              endorse_marker.setPopupContent(a.address.Match_addr + '<br><br><center style="color:#999">('
               + lat + ', ' + lon + ')</center>').openPopup();
            }
          };
          xhttp.open('GET', 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&featureTypes=&location='
                     + lon + ',' + lat, true);
          xhttp.send();
        }
      };
      xhttp.open('GET', publisher + '/search.php?fingerprint=' + fingerprint, true);
      xhttp.send();
    }
    video.style.display = '';
    list.style.display = 'none';
    button.innerHTML = 'Cancel';
    scanner = new QrScanner(video, fingerprint => setResult(fingerprint));
    scanner.start();
  });

  function checkEndorse() {
    var button = document.getElementById('endorse');
    if (document.getElementById('endorse-picture-check').checked &&
        document.getElementById('endorse-name-check').checked &&
        document.getElementById('endorse-coords-check').checked)
      button.removeAttribute('disabled');
    else
      button.setAttribute('disabled', 'disabled');
  }
  document.getElementById('endorse-picture-check').addEventListener('change', checkEndorse);
  document.getElementById('endorse-name-check').addEventListener('change', checkEndorse);
  document.getElementById('endorse-coords-check').addEventListener('change', checkEndorse);

  function clearEndorseChecks() {
    document.getElementById('endorse-picture-check').checked = false;
    document.getElementById('endorse-name-check').checked = false;
    document.getElementById('endorse-coords-check').checked = false;
    document.getElementById('endorse').setAttribute('disabled', 'disabled');
  }

  function clearEndorse() {
    var button = document.getElementById('endorse-button');
    button.innerHTML = 'Endorse a Citizen';
    button.removeAttribute('disabled');
    document.getElementById('endorse-button-group').style.display = '';
    document.getElementById('endorse-citizen').style.display = 'none';
    clearEndorseChecks();
  }

  document.getElementById('endorse-cancel').addEventListener('click', clearEndorse);

  document.getElementById('endorse').addEventListener('click', function() {
    document.getElementById('endorse-button').setAttribute('disabled', 'disabled');
    document.getElementById('endorse-cancel').setAttribute('disabled', 'disabled');
    var endorsement = {
      schema: 'https://directdemocracy.vote/json-schema/0.0.1/endorsement.schema.json',
      key: citizen.key,
      signature: '',
      published: new Date().getTime(),
      expires: endorsed.expires,
      publication: {
        key: endorsed.key,
        signature: endorsed.signature
      }
    };
    let str = JSON.stringify(endorsement);
    endorsement.signature = crypt.sign(str, CryptoJS.SHA256, 'sha256');
    var xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Endorsement error', JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          showModal('Endorsement success', 'You successfully endorsed ' + endorsed.givenNames + ' ' + endorsed.familyName);
          let e = {
            published: endorsed.published,
            expires: endorsed.expires,
            familyName: endorsed.familyName,
            givenNames: endorsed.givenNames,
            picture: endorsed.picture,
            fingerprint: endorsed_fingerprint
          };
          endorsements.push(e);
          localStorage.setItem("endorsements", JSON.stringify(endorsements));
          updateEndorsements();
        }
        clearEndorse();
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(endorsement));
  });

  function updateEndorsements() {
    var list = document.getElementById('endorsements-list');
    list.innerHTML = '';  // clear
    endorsements.forEach(function(endorsement, index) {
      let div = document.createElement('div');
      div.classList.add('container');
      let table = document.createElement('table');
      div.appendChild(table);
      table.style.width = '100%';
      table.style.maxWidth = '400px';
      table.style.marginBottom = '15px';
      let tr = document.createElement('tr');
      table.appendChild(tr);
      let td = document.createElement('td');
      tr.appendChild(td);
      let img = document.createElement('img');
      td.setAttribute('rowspan', '3');
      td.appendChild(img);
      img.src = endorsement.picture;
      img.style.width='45px';
      img.style.height='60px';
      td = document.createElement('td');
      td.setAttribute('colspan', '3');
      tr.appendChild(td);
      let a = document.createElement('a');
      td.appendChild(a);
      a.href = publisher + '/search.php?fingerprint=' + endorsement.fingerprint;
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
      td.appendChild(document.createTextNode('Endorsed:'));
      td.style.paddingRight = '10px';
      td = document.createElement('td');
      tr.appendChild(td);
      let t = new Date(endorsement.published).toISOString().slice(0, 10);
      td.classList.add('citizen-date');
      td.appendChild(document.createTextNode(t));
      td = document.createElement('td');
      td.setAttribute('rowspan', '2');
      tr.appendChild(td);
      let button = document.createElement('button');
      button.classList.add('btn');
      button.classList.add('btn-danger');
      button.appendChild(document.createTextNode('Revoke'));
      td.appendChild(button);
      tr = document.createElement('tr');
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
      list.appendChild(div);
      button.addEventListener('click', function() {
        let name = endorsement.givenNames + ' ' + endorsement.familyName;
        console.log('revoking ' + name);
        document.getElementById('revoke-citizen-name').innerHTML = name;
        $('#modal-revoke-citizen').modal();
      });
    });
  }

  clearForms();
  clearEndorseChecks();
  $('.nav-tabs').on('shown.bs.tab', function(event) {
    if (register_map) register_map.invalidateSize();
  });
  publisher = localStorage.getItem('publisher');
  if (!publisher)
    publisher = 'https://publisher.directdemocracy.vote';
  document.getElementById('publisher').value = publisher;
  privateKey = localStorage.getItem('privateKey');
  if (!privateKey) generateNewKeyPair();
  else {
    crypt = new JSEncrypt();
    crypt.setPrivateKey(privateKey);
    document.getElementById('register-forging-spinner').style.display = 'none';
    document.getElementById('register-private-key-icon').style.display = '';
    document.getElementById('register-private-key-message').innerHTML = 'Using your existing private key.';
  }
  var citizen_string = localStorage.getItem('citizen');
  if (citizen_string) {
    citizen = JSON.parse(citizen_string);
    document.getElementById('register-nav').style.display = 'none';
    $('.nav-tabs a[href="#citizen"]').tab('show');
    updateCitizenCard();
    let e = localStorage.getItem('endorsements');
    if (e) {
      endorsements = JSON.parse(e);
      updateEndorsements();
    }
  } else {
    document.getElementById('citizen-nav').style.display = 'none';
    document.getElementById('endorsements-nav').style.display = 'none';
    document.getElementById('revoke-key').setAttribute('disabled', 'disabled');
    document.getElementById('edit').setAttribute('disabled', 'disabled');
    $('.nav-tabs a[href="#register"]').tab('show');
    citizen = {
      schema: 'https://directdemocracy.vote/json-schema/0.0.1/citizen.schema.json',
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
}
