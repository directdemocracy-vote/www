import QrScanner from './qr-scanner.min.js';
QrScanner.WORKER_PATH = 'js/qr-scanner-worker.min.js';

var app = new Framework7({
  root: '#app',
  name: 'directdemocracy.vote',
  id: 'directdemocracy.vote',
});

var mainView = app.views.create('.view-main');

window.onload = function() {
  let croppie = null;
  let citizen = {};

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
      // validate();
    });
    return false;
  });

};
