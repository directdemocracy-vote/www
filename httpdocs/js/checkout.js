window.addEventListener('load', function() {
  function findGetParameter(parameterName) {
    let result = null;
    location.search.substr(1).split("&").forEach(function (item) {
      let tmp = item.split("=");
      if (tmp[0] === parameterName)
        result = decodeURIComponent(tmp[1]);
    });
    return result;
  }
  const key = findGetParameter('key');
  if (key !== null) {
    fetch(`/stripe/payment.php?key=${key}`)
      .then(response => response.json())
      .then(answer => {
        const thanks = document.getElementById('donate-thank-you');
        const info = document.getElementById('donate-information');
        document.getElementById('donate-3').scrollIntoView(true);
        if (answer.error) {
          thanks.textContent = 'There was an error processing your payment.';
          info.textContent = answer.error;
        } else {
          const name = answer.organization === '' ? answer.givenNames : answer.organization;
          const received = answer.paid !== '0000-00-00 00:00:00';
          thanks.textContent = received
            ? `Thank you ${name} for supporting directdemocracy!`
            : `${name}, we didn't received your payment because it was either cancelled or delayed.`;
          info.textContent = received
            ? 'You should have received an e-mail with a confirmation of your donation.'
            : "In the latter case, we will send you an e-mail as soon as we receive it. Otherwise, please consider using a different payment method.";
        }
        document.getElementById('donate-explanation').classList.add('is-hidden');
        document.getElementById('donate-form').classList.add('is-hidden');
        document.getElementById('donate-complete').classList.remove('is-hidden');
        document.getElementById('donate-back').classList.remove('is-hidden');
        document.getElementById('donate-1').textContent = 'circle';
        document.getElementById('donate-3').textContent = 'circle_fill';
      });
  }
  const test = location.pathname === '/stripe_test.html';
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
    const button = event.currentTarget;
    button.classList.add('is-loading');
    const publishableKey = test ?
      'pk_test_51ONAiHJ8bitZPVQT83mvU9hsFgAcXYctJa6wFynuQ7ZieWQHLeFmmdNlJMpECaIkVz87vBHnbBgW9q48qc9fdvcr00oudVLpYM' :
      'pk_live_51ONAiHJ8bitZPVQTzSVJATuEtVz6UV6BroUIKV8U3uj4XwWTKmcDFGgQf2t26ZMhobcYr8FdacGYiyNOTyVLMZKa00pyPJ7JEI';
    const stripe = Stripe(publishableKey);
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
    const testParameter = test ? '&test=1' : '';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parameters = `amount=${amount}&frequency=${frequency}&currency=${currency}&email=${encodeURIComponent(email)}&` +
                       `givenNames=${encodeURIComponent(givenNames)}&familyName=${encodeURIComponent(familyName)}&` +
                       `organization=${encodeURIComponent(organization)}&comment=${encodeURIComponent(comment)}&` +
                       `display=${display}&displayGivenNames=${displayGivenNames}&hideAmount=${hideAmount}&` +
                       `timeZone=${timeZone}${testParameter}`;
    const response = await fetch(`/stripe/checkout.php?${parameters}`, {method: 'POST'});
    const {clientSecret, paymentId} = await response.json();
    const handleComplete = async function() {
      checkout.unmount();
      checkout.destroy();
      checkout = null;
      document.getElementById('donate-checkout').classList.add('is-hidden');
      document.getElementById('donate-complete').classList.remove('is-hidden');
      document.getElementById('donate-2').textContent = 'circle';
      document.getElementById('donate-3').textContent = 'circle_fill';
      document.getElementById('donate-thank-you').textContent =
        `Thank you ${isOrganization ? organization : givenNames} for supporting directdemocracy!`
      document.getElementById('donate-information').textContent = 'You should have received an e-mail with a confirmation of your donation.';
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
    const comment = document.getElementById('donate-comment');
    if (event.currentTarget.checked) {
      donateDisplayText.setAttribute('data-i18n', 'display-donation-and-comment');
      donateDisplayText.textContent = translator.translate('display-donation-and-comment');
      classList.remove('is-hidden');
      comment.setAttribute('required', '');
    } else {
      donateDisplayText.setAttribute('data-i18n', 'display-donation');
      donateDisplayText.textContent = translator.translate('display-donation');
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
