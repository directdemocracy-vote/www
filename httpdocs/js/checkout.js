window.addEventListener("load", function() {
  let checkout;
  let step = 1;
  let frequency = 1; // 1: one-time, 2: monthly, 3: annually
  let amount = 5;
  const amounts = [5, 10, 20, 50, 100, 200, 500, 1000];
  let isOrganization = false;
  let display = false;
  document.getElementById('donate-button').addEventListener('click', async function(event) {
    const button = event.currentTarget;
    button.classList.add('is-loading');
    const stripe = Stripe('pk_test_51ONAiHJ8bitZPVQT83mvU9hsFgAcXYctJa6wFynuQ7ZieWQHLeFmmdNlJMpECaIkVz87vBHnbBgW9q48qc9fdvcr00oudVLpYM');
    const response = await fetch('/stripe/checkout.php', {method: 'POST'});
    const {clientSecret} = await response.json();
    checkout = await stripe.initEmbeddedCheckout({clientSecret});
    document.getElementById('donate-explanation').classList.add('is-hidden');
    document.getElementById('donate-form').classList.add('is-hidden');
    document.getElementById('donate-checkout').classList.remove('is-hidden');
    document.getElementById('donate-back').classList.remove('is-hidden');
    document.getElementById('donate-1').textContent = 'circle';
    document.getElementById('donate-2').textContent = 'circle_fill';
    button.classList.remove('is-loading');
    checkout.mount('#donate-checkout');
    step = 2;
  });
  document.getElementById('donate-back').addEventListener('click', async function(event) {
    checkout.unmount();
    checkout.destroy();
    document.getElementById('donate-explanation').classList.remove('is-hidden');
    document.getElementById('donate-form').classList.remove('is-hidden');
    document.getElementById('donate-checkout').classList.add('is-hidden');
    document.getElementById('donate-back').classList.add('is-hidden');
    document.getElementById('donate-1').textContent = 'circle_fill';
    document.getElementById('donate-2').textContent = 'circle';
    step = 1;
  });
  document.getElementById('donate-one-time').addEventListener('click', function(event) {
    if (frequency === 1)
      return;
    event.currentTarget.classList.add('is-info');
    document.getElementById(frequency === 2 ? 'donate-monthly' : 'donate-annually').classList.remove('is-info');
    frequency = 1;
  });
  document.getElementById('donate-monthly').addEventListener('click', function(event) {
    if (frequency === 2)
      return;
    event.currentTarget.classList.add('is-info');
    document.getElementById(frequency === 1 ? 'donate-one-time' : 'donate-annually').classList.remove('is-info');
    frequency = 2;
  });
  document.getElementById('donate-annually').addEventListener('click', function(event) {
    if (frequency === 3)
      return;
    event.currentTarget.classList.add('is-info');
    document.getElementById(frequency === 1 ? 'donate-one-time' : 'donate-monthly').classList.remove('is-info');
    frequency = 3;
  });
  for(const a of amounts) {
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
    if (event.currentTarget.checked)
      classList.remove('is-hidden');
    else
      classList.add('is-hidden');
  });
  document.getElementById('donate-display-checkbox').addEventListener('click', function(event) {
    const firstName = document.getElementById('donate-display-first-name-field').classList;
    const hideAmount = document.getElementById('donate-hide-amount-field').classList;
    if (event.currentTarget.checked) {
      if (!isOrganization)
        firstName.remove('is-hidden');
      hideAmount.remove('is-hidden');
      display = true;
    } else {
      if (!isOrganization)
        firstName.add('is-hidden');
      hideAmount.add('is-hidden');
      display = false;
    }
  });
  document.getElementById('donate-organization-checkbox').addEventListener('click', function(event) {
    const classList = document.getElementById('donate-organization-field').classList;
    const displayFirstName = document.getElementById('donate-display-first-name-field').classList;
    const name = document.getElementById('donate-name-field').classList;
    if (event.currentTarget.checked) {
      isOrganization = true;
      classList.remove('is-hidden');
      name.add('is-hidden');
      if (display)
        displayFirstName.add('is-hidden');
    } else {
      ifOrganization = false;
      classList.add('is-hidden');
      name.remove('is-hidden');
      if (display)
        displayFirstName.remove('is-hidden');
    }
  });
});
