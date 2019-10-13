window.onload = function() {
  let private_key = localStorage.getItem('privateKey');
  let publisher = localStorage.getItem('publisher');
  let trustee = localStorage.getItem('trustee');
  let latitude = 0;
  let longitude = 0;
  let address = '';
  let crypt = null;
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
  if (private_key) {
    crypt = new JSEncrypt();
    crypt.setPrivateKey(private_key);
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
    xhttp.send('key=' + encodeURIComponent(stripped_key(crypt.getPublicKey())));
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
        address = a.address;
        let select = document.getElementById('area');
        let count = 0;
        function addAdminLevel(level) {
          if (level in address)
            select.options[count++] = new Option(address[level], level);
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
            .indexOf(country_code) >= 0)
          select.options[count++] = new Option('European Union', 'union');
        select.options[count++] = new Option('Earth', 'world');
        areaChange();
      }
    };
    let lat = latitude / 1000000;
    let lon = longitude / 1000000;
    xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon, true);
    xhttp.send();
  }
  document.getElementById('area').addEventListener('change', areaChange);
  function areaChange() {
    let query = '';
    let area = document.getElementById('area');
    let first = area.options[area.selectedIndex].innerHTML;
    for(var i = area.selectedIndex; i < area.length - 1; i++)
      query += area.options[i].innerHTML + ', ';
    query = query.slice(0, -2);
    let place = document.getElementById('place');
    place.href = 'https://nominatim.openstreetmap.org/search.php?q=' + encodeURI(query) + '&polygon_geojson=1&viewbox=';
    place.innerHTML = first;
  }
  function validate() {
    var button = document.getElementById('publish-button');
    button.setAttribute('disabled', 'disabled');
    if (latitude == 0 && longitude == 0)
      return;
    if (trustee_key == '')
      return;
    if (document.getElementById('title').value == '')
      return;
    if (document.getElementById('description').value == '')
      return;
    if (document.getElementById('question').value == '')
      return;
    if (document.getElementById('answers').value == '')
      return;
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
  document.getElementById('question').addEventListener('input', validate);
  document.getElementById('answers').addEventListener('input', validate);
  document.getElementById('deadline-day').addEventListener('input', validate);
  document.getElementById('deadline-hour').addEventListener('input', validate);
  document.getElementById('deadline-time-zone').addEventListener('input', validate);
  document.getElementById('publish-button').addEventListener('click', function() {
    area = {};
    area.reference = 'nominatim.openstreetmap.org';
    area.latitude = latitude;
    area.longitude = longitude;
    a = document.getElementById('area');
    area.type = a.value;
    area.name = a.options[a.selectedIndex].innerHTML;
    referendum = {};
    referendum.schema = 'https://directdemocracy.vote/json-schema/0.0.1/referendum.schema.json';
    referendum.key = stripped_key(crypt.getPublicKey());
    referendum.signature = '';
    referendum.published = new Date().getTime();
    referendum.expires = new Date(new Date().setFullYear(new Date().getFullYear() + 10)).getTime();  // 10 years
    referendum.trustee = trustee_key;
    referendum.areas = [];
    referendum.areas[0] = area;
    referendum.title = document.getElementById('title').value;
    referendum.description = document.getElementById('description').value;
    referendum.question = document.getElementById('question').value;
    let answers = document.getElementById('answers').value.split(',');
    referendum.answers = [];
    for(let i = 0; i < answers.length; i++)
      referendum.answers[i] = answers[i].trim();
    referendum.deadline = deadline;
    let website = document.getElementById('website').value;
    if (website)
      referendum.website = website;
    let str = JSON.stringify(referendum);
    referendum.signature = crypt.sign(str, CryptoJS.SHA256, 'sha256');
    console.log(JSON.stringify(referendum));
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Publication error', JSON.stringify(answer.error));
        else {
          showModal('Publication success', 'Your referendum was published under number ' + answer.fingerprint
          + '.<br>Check it at <a target="_blank" href="' + publisher + '/publication.php?fingerprint=' + answer.fingerprint
          + '">' + publisher + '/publication.php?id=' + answer.fingerprint + '</a><br>');
        }
      }
    };
    xhttp.open('POST', publisher + '/publish.php', true);
    xhttp.send(JSON.stringify(referendum));
    return false;
  });
};