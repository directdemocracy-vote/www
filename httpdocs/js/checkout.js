document.getElementById('donate-button').addEventListener('click', async function(event) {
  event.currentTarget.classList.add('is-loading');
  const stripe = Stripe("pk_test_51ONAiHJ8bitZPVQT83mvU9hsFgAcXYctJa6wFynuQ7ZieWQHLeFmmdNlJMpECaIkVz87vBHnbBgW9q48qc9fdvcr00oudVLpYM");
  const response = await fetch("/stripe/checkout.php", {method: "POST"});
  const {clientSecret} = await response.json();
  const checkout = await stripe.initEmbeddedCheckout({clientSecret});
  checkout.mount('#donate-checkout');
  document.getElementById('donate-explanation').classList.add('is-hidden');
  document.getElementById('donate-form').classList.add('is-hidden');
  document.getElementById('donate-checkout').classList.remove('is-hidden');  
});
