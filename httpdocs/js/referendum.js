window.onload = function() {
  let private_key = localStorage.getItem('privateKey');
  let publisher = localStorage.getItem('publisher');
  let trustee = localStorage.getItem('trustee');
  let latitude = 0;
  let longitude = 0;
  let address = '';
  if (private_key) {
    crypt = new JSEncrypt();
    crypt.setPrivateKey(private_key);
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      if (this.status == 200) {
        let answer = JSON.parse(this.responseText);
        if (answer.error)
          showModal('Coordinates error', JSON.stringify(answer.error) + '.<br>Please try again.');
        else {
          latitude = answer.latitude / 1000000;
          longitude = answer.longitude / 1000000;
          updateArea();
        }
      }
    };
    xhttp.open('POST', publisher + '/coordinates.php', true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('key=' + encodeURIComponent(crypt.getPublicKey()));
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
    area.level = a.value;
    area.name = a.options[a.selectedIndex].innerHTML;
    referendum = {};
    referendum.area = area;
    referendum.title = document.getElementById('title').value;
    referendum.description = document.getElementById('description').value;
    referendum.question = document.getElementById('question').value;
    referendum.answers = document.getElementById('answers').value;
    referendum.website = document.getElementById('website').value;
    referendum.deadline = document.getElementById('deadline').value;
    console.log(JSON.stringify(referendum));
  });
};
