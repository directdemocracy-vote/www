window.addEventListener('load', function() {
  function findGetParameter(parameterName) {
    location.search.substr(1).split("&").forEach(function (item) {
      let tmp = item.split("=");
      if (tmp[0] === parameterName)
        return decodeURIComponent(tmp[1]);
    });
    return null;
  }
  const reference = findGetParameter('reference');
  console.log('reference = ' + reference);
  for (const checkbox of document.querySelectorAll('input[type="checkbox"]:checked'))
    checkbox.checked = false;
  let checkout = null;
  let frequency = 'one-time';
  let amount = 5;
  const amounts = [5, 10, 20, 50, 100, 200, 500, 1000];
  let isOrganization = false;
  let display = 0;
  document.getElementById('donate-button').addEventListener('click', async function(event) {
    if (!document.getElementById('donate-email').reportValidity())
      return;
    if (!document.getElementById('donate-given-names').reportValidity())
      return;
    if (!document.getElementById('donate-family-name').reportValidity())
      return;
    if (!document.getElementById('donate-organization').reportValidity())
      return;
    if (!document.getElementById('donate-comment').reportValidity())
      return;
    if (!document.getElementById('donate-terms-of-service').reportValidity())
      return;
    const button = event.currentTarget;
    button.classList.add('is-loading');
    const stripe = Stripe(
      'pk_test_51ONAiHJ8bitZPVQT83mvU9hsFgAcXYctJa6wFynuQ7ZieWQHLeFmmdNlJMpECaIkVz87vBHnbBgW9q48qc9fdvcr00oudVLpYM');
    const currency = document.querySelectorAll('input[name="donate-currency"]:checked')[0].value;
    const email = document.getElementById('donate-email').value;
    const isOrganization = document.getElementById('donate-organization-checkbox').checked;
    const givenNames = isOrganization ? '' : document.getElementById('donate-given-names').value;
    const familyName = isOrganization ? '' : document.getElementById('donate-family-name').value;
    const organization = isOrganization ? document.getElementById('donate-organization').value : '';
    const comment = document.getElementById('donate-comment-checkbox').checked
      ? document.getElementById('donate-comment').value : '';
    const displayGivenNames = isOrganization ? 0 : (document.getElementById('donate-display-given-names-checkbox').checked ? 1 : 0);
    const hideAmount = document.getElementById('donate-hide-amount-checkbox').checked ? 1 : 0;
    const parameters = `amount=${amount}&frequency=${frequency}&currency=${currency}&email=${encodeURIComponent(email)}&` +
                       `givenNames=${encodeURIComponent(givenNames)}&familyName=${encodeURIComponent(familyName)}&` +
                       `organization=${encodeURIComponent(organization)}&comment=${encodeURIComponent(comment)}&` +
                       `display=${display}&displayGivenNames=${displayGivenNames}&hideAmount=${hideAmount}`;
    const response = await fetch(`/stripe/checkout.php?${parameters}`, {method: 'POST'});
    const {clientSecret, paymentId} = await response.json();
    const handleComplete = async function() {
      checkout.unmount();
      checkout.destroy();
      checkout = null;
      // fetch client data from database
      document.getElementById('donate-checkout').classList.add('is-hidden');
      document.getElementById('donate-complete').classList.remove('is-hidden');
      document.getElementById('donate-2').textContent = 'circle';
      document.getElementById('donate-3').textContent = 'circle_fill';
      document.getElementById('donate-thank-you').textContent = `Thank you ${isOrganization ? organization : givenNames} for supporting directdemocracy!`;
    };
    checkout = await stripe.initEmbeddedCheckout({clientSecret, onComplete: handleComplete});
    document.getElementById('donate-explanation').classList.add('is-hidden');
    document.getElementById('donate-form').classList.add('is-hidden');
    document.getElementById('donate-checkout').classList.remove('is-hidden');
    document.getElementById('donate-back').classList.remove('is-hidden');
    document.getElementById('donate-1').textContent = 'circle';
    document.getElementById('donate-2').textContent = 'circle_fill';
    button.classList.remove('is-loading');
    checkout.mount('#donate-checkout');
  });
  document.getElementById('donate-back').addEventListener('click', async function(event) {
    if (checkout) {
      checkout.unmount();
      checkout.destroy();
      checkout = null;
    }
    document.getElementById('donate-explanation').classList.remove('is-hidden');
    document.getElementById('donate-form').classList.remove('is-hidden');
    document.getElementById('donate-checkout').classList.add('is-hidden');
    document.getElementById('donate-complete').classList.add('is-hidden');
    document.getElementById('donate-back').classList.add('is-hidden');
    document.getElementById('donate-1').textContent = 'circle_fill';
    document.getElementById('donate-2').textContent = 'circle';
    document.getElementById('donate-3').textContent = 'circle';
  });
  document.getElementById('donate-one-time').addEventListener('click', function(event) {
    if (frequency === 'one-time')
      return;
    event.currentTarget.classList.add('is-info');
    document.getElementById(frequency === 'monthly' ? 'donate-monthly' : 'donate-annually').classList.remove('is-info');
    frequency = 'one-time';
  });
  document.getElementById('donate-monthly').addEventListener('click', function(event) {
    if (frequency === 'monthly')
      return;
    event.currentTarget.classList.add('is-info');
    document.getElementById(frequency === 'one-time' ? 'donate-one-time' : 'donate-annually').classList.remove('is-info');
    frequency = 'monthly';
  });
  document.getElementById('donate-annually').addEventListener('click', function(event) {
    if (frequency === 'annually')
      return;
    event.currentTarget.classList.add('is-info');
    document.getElementById(frequency === 'one-time' ? 'donate-one-time' : 'donate-monthly').classList.remove('is-info');
    frequency = 'annually';
  });
  for (const a of amounts) {
    document.getElementById(`donate-${a}`).addEventListener('click', function(event) {
      if (amount === a)
        return;
      event.currentTarget.classList.add('is-info');
      document.getElementById(`donate-${amount}`).classList.remove('is-info');
      amount = a;
    });
  }
  document.getElementById('donate-comment-checkbox').addEventListener('click', function(event) {
    const classList = document.getElementById('donate-comment-field').classList;
    const donateDisplayText = document.getElementById('donate-display-text');
    const comment = document.getElementById('donate-comment').classList;
    if (event.currentTarget.checked) {
      donateDisplayText.textContent = 'Display donation and comment';
      classList.remove('is-hidden');
      comment.setAttribute('required', '');
    } else {
      donateDisplayText.textContent = 'Display donation';
      classList.add('is-hidden');
      comment.removeAttribute('required');
    }
  });
  document.getElementById('donate-display-checkbox').addEventListener('click', function(event) {
    const displayGivenNames = document.getElementById('donate-display-given-names-field').classList;
    const hideAmount = document.getElementById('donate-hide-amount-field').classList;
    if (event.currentTarget.checked) {
      if (!isOrganization)
        displayGivenNames.remove('is-hidden');
      hideAmount.remove('is-hidden');
      display = 1;
    } else {
      displayGivenNames.add('is-hidden');
      hideAmount.add('is-hidden');
      display = 0;
    }
  });
  document.getElementById('donate-organization-checkbox').addEventListener('click', function(event) {
    const classList = document.getElementById('donate-organization-field').classList;
    const displayGivenNames = document.getElementById('donate-display-given-names-field').classList;
    const givenNames = document.getElementById('donate-given-names');
    const familyName = document.getElementById('donate-family-name');
    const organization = document.getElementById('donate-organization');
    const name = document.getElementById('donate-name-field').classList;
    if (event.currentTarget.checked) {
      givenNames.removeAttribute('required');
      familyName.removeAttribute('required');
      organization.setAttribute('required', '');
      isOrganization = true;
      classList.remove('is-hidden');
      name.add('is-hidden');
      if (display)
        displayGivenNames.add('is-hidden');
    } else {
      givenNames.setAttribute('required', '');
      familyName.setAttribute('required', '');
      organization.removeAttribute('required');
      isOrganization = false;
      classList.add('is-hidden');
      name.remove('is-hidden');
      if (display)
        displayGivenNames.remove('is-hidden');
    }
  });
});
