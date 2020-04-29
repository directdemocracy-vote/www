//import 'https://cdn.jsdelivr.net/npm/exif-js';
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
    <div class="block">
      <p><img id="edit-picture"></p>
      <div class="row">
        <button class="col button" id="rotate-right"><i class="icon f7-icons">rotate_right_fill</i></button>
        <button class="col button" id="rotate-left"><i class="icon f7-icons">rotate_left_fill</i></button>
      </div>
    </div>
  </div>
</div>`;
    var sheet = app.sheet.create({
      content: content.innerHTML,
      on: {
        opened: function() {
          console.log('Sheet opened');
        }
      }
    });
    sheet.open();
    let img = document.getElementById('edit-picture');
    img.src = URL.createObjectURL(event.target.files[0]);
    event.target.value = '';
    let w = screen.width * 0.8;
    croppie = new Croppie(img, {
      boundary: {
        width: w,
        height: w * 1.5
      },
      viewport: {
        width: w * 0.75,
        height: w * 0.75 * 1.5
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

    // document.getElementById('picture-select').style.display = '';
  });
  /*
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
  */
};
