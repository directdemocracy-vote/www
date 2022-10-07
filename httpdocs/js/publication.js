window.onload = function() {
  const directdemocracy_version = '0.0.1';
  const publisher = localStorage.getItem('publisher');
  const trustee = localStorage.getItem('trustee');
  const citizen_private_key = localStorage.getItem('privateKey');
  const publication_type = document.getElementById('publication_type').value;

  let publication_private_key = '';
  let latitude = 0;
  let longitude = 0;
  let area = '';
  let citizen_crypt = null;
  let publication_crypt = null;
  let trustee_key = '';
  let offset = new Date().getTimezoneOffset();
  let hour = -offset / 60;
  let v = '';
  if (offset < 0)
    v = '+';
  if (-offset % 60 == 0)
    hour = v + hour + ":00";
  else
    hour = v + hour + ":" + (-offset % 60);
  document.getElementById('deadline-time-zone').value = hour;
  let deadline = 0;

  function showModal(title, contents) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-contents').innerHTML = contents;
    $('#modal').modal();
  }

  function generateNewKeyPair() {
    document.getElementById('publication-forging-spinner').style.display = '';
    document.getElementById('publication-private-key-icon').style.display = 'none';
    document.getElementById('publication-private-key-message').innerHTML = 'Forging a new private key, please wait...';
    let dt = new Date();
    let time = -(dt.getTime());
    publication_crypt = new JSEncrypt({
      default_key_size: 2048
    });
    publication_crypt.getKey(function() {
      dt = new Date();
      time += (dt.getTime());
      publication_private_key = publication_crypt.getPrivateKey();
      document.getElementById('publication-forging-spinner').style.display = 'none';
      document.getElementById('publication-private-key-icon').style.display = '';
      document.getElementById('publication-private-key-message').innerHTML =
        'A publication private key was just forged in ' +
        Number(time / 1000).toFixed(2) + ' seconds.';
      validate();
    });
  }

  function stripped_key(public_key) {
    let stripped = '';
    const header = '-----BEGIN PUBLIC KEY-----\n'.length;
    const footer = '-----END PUBLIC KEY-----'.length;
    const l = public_key.length - footer;
    for (let i = header; i < l; i += 65)
      stripped += public_key.substr(i, 64);
    stripped = stripped.slice(0, -1 - footer);
    return stripped;
  }
  if (citizen_private_key) {
    citizen_crypt = new JSEncrypt();
    citizen_crypt.setPrivateKey(citizen_private_key);
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Coordinates error', JSON.stringify(answer.error));
        else {
          latitude = answer.latitude;
          longitude = answer.longitude;
          updateArea();
          validate();
        }
      }
    };
    xhttp.open('POST', publisher + '/coordinates.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('key=' + encodeURIComponent(stripped_key(citizen_crypt.getPublicKey())));
  }
  if (trustee) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Trustee key', JSON.stringify(answer.error));
        else {
          trustee_key = answer.key;
          validate();
        }
      }
    };
    xhttp.open('POST', trustee + '/key.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send();
  }

  function updateArea() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const a = JSON.parse(this.responseText);
        let address = a.address;
        let select = document.getElementById('area');
        let count = 0;

        function addAdminLevel(level) {
          if (level in address)
            select.options[count++] = new Option(address[level], level);
        }
        // we ignore admin levels lowed than 'village':
        // 'block', 'neighbourhood', 'quarter', 'suburb', 'borough' and 'hamlet'
        const admin = ['village', 'town',
          'city',
          'municipality',
          'county', 'district',
          'region', 'province', 'state',
          'country'
        ];
        admin.forEach(function(item) {
          addAdminLevel(item);
        });
        const country_code = address.country_code.toUpperCase();
        if (['GB', 'DE', 'FR', 'IT', 'SE', 'PL', 'RO', 'HR', 'ES', 'NL', 'IE', 'BG', 'DK', 'GR',
            'AT', 'HU', 'FI', 'CZ', 'PT', 'BE', 'MT', 'CY', 'LU', 'SI', 'LU', 'SK', 'EE', 'LV'
          ]
          .indexOf(country_code) >= 0)
          select.options[count++] = new Option('European Union', 'union');
        select.options[count++] = new Option('Earth', 'world');
        areaChange();
      }
    };
    xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + latitude + '&lon=' + longitude +
      '&zoom=10', true);
    xhttp.send();
  }
  document.getElementById('area').addEventListener('change', areaChange);

  function areaChange() {
    let a = document.getElementById('area');
    let selected_name = a.options[a.selectedIndex].innerHTML;
    let selected_type = a.options[a.selectedIndex].value;
    area = '';
    let query = '';
    for (let i = a.selectedIndex; i < a.length - 1; i++) {
      let type = a.options[i].value;
      if (['village', 'town', 'municipality'].includes(type))
        type = 'city';
      const name = a.options[i].innerHTML;
      area += type + '=' + name + '\n';
      if (type != 'union')
        query += type + '=' + encodeURIComponent(name) + '&';
    }
    query = query.slice(0, -1);
    let place = document.getElementById('place');
    place.innerHTML = selected_name;
    if (selected_type == 'union' && selected_name == 'European Union')
      place.href = 'https://en.wikipedia.org/wiki/European_Union';
    else if (selected_type == 'world' && selected_name == 'Earth')
      place.href = 'https://en.wikipedia.org/wiki/Earth';
    else
      place.href = 'https://nominatim.openstreetmap.org/search.php?' + query + '&polygon_geojson=1';
  }

  function validate() {
    let button = document.getElementById('publish-button');
    button.setAttribute('disabled', 'disabled');
    if (latitude == 0 && longitude == 0)
      return;
    if (publication_private_key === '')
      return;
    if (trustee_key == '')
      return;
    if (document.getElementById('title').value == '')
      return;
    if (document.getElementById('description').value == '')
      return;
    if (publication_type === 'referendum') {
      if (document.getElementById('question').value == '')
        return;
      if (document.getElementById('answers').value == '')
        return;
    }
    if (document.getElementById('deadline-day').value == '')
      return;
    if (document.getElementById('deadline-hour').value == '')
      return;
    if (document.getElementById('deadline-time-zone').value == '')
      return;
    let isotime = document.getElementById('deadline-day').value;
    let hour = document.getElementById('deadline-hour').value;
    if (hour.length < 2)
      hour = '0' + hour;
    isotime += "T" + hour + ':00:00.000';
    let offset = document.getElementById('deadline-time-zone').value;
    if (offset[0] != '+' && offset[0] != '-')
      return;
    if (offset.length < 6)
      offset = offset[0] + '0' + offset.slice(1, 5);
    if (offset.length < 6)
      return;
    isotime += offset;
    deadline = Date.parse(isotime);
    if (Number.isNaN(deadline))
      return;
    button.removeAttribute('disabled');
  }
  document.getElementById('title').addEventListener('input', validate);
  document.getElementById('description').addEventListener('input', validate);
  if (publication_type == 'referendum') {
    document.getElementById('question').addEventListener('input', validate);
    document.getElementById('answers').addEventListener('input', validate);
  }
  document.getElementById('deadline-day').addEventListener('input', validate);
  document.getElementById('deadline-hour').addEventListener('input', validate);
  document.getElementById('deadline-time-zone').addEventListener('input', validate);
  document.getElementById('publish-button').addEventListener('click', function() {
    publication = {};
    publication.schema = 'https://directdemocracy.vote/json-schema/' + directdemocracy_version +
      '/referendum.schema.json';
    publication.key = stripped_key(publication_crypt.getPublicKey());
    publication.signature = '';
    publication.published = new Date().getTime();
    publication.expires = new Date(new Date().setFullYear(new Date().getFullYear() + 10)).getTime(); // 10 years
    publication.trustee = trustee_key;
    publication.area = area;
    publication.title = document.getElementById('title').value.trim();
    publication.description = document.getElementById('description').value.trim();
    if (publication_type == 'referendum') {
      publication.question = document.getElementById('question').value.trim();
      publication.answers = document.getElementById('answers').value.trim();
    }
    publication.secret = (document.getElementById('ballots').value === 'anonymous');
    publication.deadline = deadline;
    let website = document.getElementById('website').value.trim();
    if (website)
      publication.website = website;
    let str = JSON.stringify(publication);
    publication.signature = publication_crypt.sign(str, CryptoJS.SHA256, 'sha256');

    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        const answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Area publication error', JSON.stringify(answer.error));
        else {
          let xhttp = new XMLHttpRequest();
          xhttp.onload = function() {
            if (this.status == 200) {
              const answer = JSON.parse(this.responseText);
              if (answer.error)
                showModal('Publication error', JSON.stringify(answer.error));
              else
                showModal('Publication success',
                  'Your ' + publication_type + ' was just published!<br>Check it <a target="_blank" href="' +
                  publisher + '/' + publication_type + '.html?fingerprint=' + answer.fingerprint + '">here</a>.<br>');
            }
          };
          xhttp.open('POST', publisher + '/publish.php', true);
          xhttp.send(JSON.stringify(publication));
        }
      }
    };
    let query = publication.area.trim().replace(/(\r\n|\n|\r)/g, "&");
    xhttp.open('GET', trustee + '/publish_area.php?' + query, true);
    xhttp.send();
  });
  generateNewKeyPair();
};
