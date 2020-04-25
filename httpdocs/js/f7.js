var app = new Framework7({
  root: '#app',
  name: 'directdemocracy.vote',
  id: 'directdemocracy.vote',
  routes: [
    {
      path: '/about/',
      template: aboutPage,
    },
    {
      path: '/settings/',
      content: 'settings'
    }
  ],
});

var mainView = app.views.create('.view-main', {
  dynamicNavBar: true
});

function aboutPage() {
  console.log("coucou");
  const content = {};
  content.innerHTML =
    `<div class="tab-pane container fade" id="about"><br>
  <div class="row">
    <div class="col-md-4">
      <h2>Vision</h2>
      <p>This initiative aims at establishing world-wide <a href="https://en.wikipedia.org/wiki/Direct_democracy" target="_blank">direct democracy</a> in order to bring peace, safety and prosperity to humananity, including saving the
        climate and the biodiversity. The principle is that people will become citizens by proposing referundums and voting regardless of any official acknowledgement. Vote results from a limited number of citizens could be considered as
        simple survey results. They could feed debates, influence political decisions and foster more people to become citizens. Vote results from areas where a majority of people are citizens will become significant from a democratic
        point of view. This will increase the pressure on governments to respect the democratic choices expressed by their people. Ultimately, this bottom-up initiative will enforce direct democracy everywhere in the world.</p>
    </div>
    <div class="col-md-4">
      <h2>Features</h2>
      <p>The proposed system implements the following necessary features:</p>
      <ul>
        <li>open to anybody with internet access from a smartphone or a computer.</li>
        <li>allowing anybody to propose referendums.</li>
        <li>fully decentralized: nobody can control it.</li>
        <li>supported by a <a href="https://en.wikipedia.org/wiki/Web_of_trust" target="_blank">web of trust</a>: distributed reputation system.</li>
        <li>verifiable: check that my vote was taken into account, check that others didn't cheat.</li>
        <li>robust to attacks, resistant to censorship.</li>
        <li>relying on state-of-the-art <a href="https://en.wikipedia.org/wiki/Cryptography" target="_blank">cryptography</a>, <a href="https://en.wikipedia.org/wiki/Free_and_open-source_software" target="_blank">free and open-source</a>
          specifications and implementations.</li>
        <li>providing easy-to-use user interfaces.</li>
        <li>aimed at gaining confidence of both technical and non-technical people.</li>
      </ul>
    </div>
    <div class="col-md-4">
      <h2>Contribute</h2>
      <p>Because the system is fully decentralized, you can become any kind of these participants:</p>
      <ul>
        <li><b>citizen</b>: anybody with internet access.</li>
        <li><b><a href="//trustee.directdemocracy.vote" target="_blank">trustee</a></b>: webservice providing a web of trust.</li>
        <li><b><a href="//station.directdemocracy.vote" target="_blank">station</a></b>: (polling station) webservice providing anonymous voting.</li>
        <li><b><a href="//publisher.directdemocracy.vote" target="_blank">publisher</a></b>: webservice publishing official signed data for directdemocracy.</li>
      </ul>
      <p>We also accept donations to support our effort. More information about this will come later.</p>
      <p><a class="btn btn-secondary" href="https://github.com/directdemocracy-vote/doc" target="_blank" role="button">View technical details &raquo;</a></p>
    </div>
  </div>
</div>`;
  return content.innerHTML;
}
