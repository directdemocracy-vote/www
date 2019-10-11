window.onload = function() {
  let private_key = localStorage.getItem('privateKey');
  let publisher = localStorage.getItem('publisher');
  let trustee = localStorage.getItem('trustee');
  let latitude = 0;
  let longitude = 0;
  let address = '';
  let crypt = null;
  let trustee_key = '';
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
          latitude = answer.latitude / 1000000;
          longitude = answer.longitude / 1000000;
          updateArea();
          update();
        }
      }
    };
    xhttp.open('POST', publisher + '/coordinates.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('key=' + encodeURIComponent(crypt.getPublicKey()));
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
          update();
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
    xhttp.open('GET', 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + latitude + '&lon=' + longitude, true);
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
    if (document.getElementById('deadline').value == '')
      return;
    button.removeAttribute('disabled');
  }
  document.getElementById('title').addEventListener('input', validate);
  document.getElementById('description').addEventListener('input', validate);
  document.getElementById('question').addEventListener('input', validate);
  document.getElementById('answers').addEventListener('input', validate);
  document.getElementById('deadline').addEventListener('input', validate);
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
    referendum.key = crypt.getPublicKey();
    referendum.signature = '';
    referendum.published = new Date().getTime();
    referendum.expires = new Date(new Date().setFullYear(new Date().getFullYear() + 10)).getTime();  // 10 years
    referendum.trustee = trustee_key;  // FIXME
    referendum.areas = array();
    referendum.areas[0] = area;
    referendum.title = document.getElementById('title').value;
    referendum.description = document.getElementById('description').value;
    referendum.question = document.getElementById('question').value;
    referendum.answers = document.getElementById('answers').value; // FIXME
    referendum.deadline = document.getElementById('deadline').value; // FIXME
    let website = document.getElementById('website').value;
    if (website)
      referendum.website = website;
    // sign
    console.log(JSON.stringify(referendum));
  });
};
