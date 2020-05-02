import QrScanner from './qr-scanner.min.js';
QrScanner.WORKER_PATH = 'js/qr-scanner-worker.min.js';

var app = new Framework7({
  root: '#app',
  name: 'directdemocracy.vote',
  id: 'directdemocracy.vote',
});

var mainView = app.views.create('.view-main');

window.onload = function() {
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

  let citizen = {
    latitude: 0,
    longitude: 0
  };
  let citizenCrypt = null;

  let privateKey = localStorage.getItem('privateKey');
  if (privateKey) {
    citizenCrypt = new JSEncrypt();
    citizenCrypt.setPrivateKey(privateKey);
    privateKeyAvailable();
  } else {
    let dt = new Date();
    let time = -(dt.getTime());
    citizenCrypt = new JSEncrypt({
      default_key_size: 2048
    });
    citizenCrypt.getKey(function() {
      dt = new Date();
      time += (dt.getTime());
      citizen.key = strippedKey(citizenCrypt.getPublicKey());
      privateKey = citizenCrypt.getPrivateKey();
      localStorage.setItem('privateKey', privateKey);
      console.log('You new private key was just forged in ' + Number(time / 1000).toFixed(2) + ' seconds.');
      privateKeyAvailable();
    });
  }

  function privateKeyAvailable() {
    let progress = document.getElementById('register-progressbar');
    progress.classList.remove('progressbar-infinite');
    progress.classList.add('progressbar');
    progress.setAttribute('data-progress', '100');
    let button = document.getElementById('register-button');
    button.classList.remove('color-gray');
    button.disabled = false;
    button.innerHTML = 'Register';
  }

  function uploadPicture() {
    document.getElementById('register-picture-upload').click();
  }
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
            format: 'jpeg',
            quality: 0.95
          }).then(function(result) {
            document.getElementById('register-picture').setAttribute('src', result);
            citizen.picture = result;
            croppie.destroy();
            croppie = null;
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
          console.log('Sheet opened');
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
        }
      }
    });
    sheet.open();
  });

};
