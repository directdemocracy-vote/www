<?php

require_once '../../vendor/autoload.php';
require_once '../../secrets.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);
header('Content-Type: application/json');

$YOUR_DOMAIN = 'https://directdemocracy.vote';

$amount = intval($_GET['amount']);
$frequency = $_GET['frequency'];
$currency = $_GET['currency'];
if ($frequency === 'one-time') {
  $mode = 'purchase';  // FIXME
} elseif ($frequency === 'monthly') {
  $mode = 'subscription';
  if (currency === 'CHF') {
    if ($amount === 5)
      $price = 'price_1OaKzgJ8bitZPVQTvUtbfTZn';
    elseif ($amount === 10)
      $price = 'price_1OaL4bJ8bitZPVQTyobHbCiR';
    elseif ($amount === 20)
      $price = 'price_1ObevfJ8bitZPVQTSrVIU7IA';
    elseif ($amount === 50)
      $price = 'price_1Obew1J8bitZPVQTGqJ1CTnh';
    elseif ($amount === 100)
      $price = 'price_1ObewCJ8bitZPVQTyxSreY3z';
    elseif ($amount === 200)
      $price = 'price_1ObewQJ8bitZPVQTgxa8P4Hz';
    elseif ($amount === 500)
      $price = 'price_1ObewlJ8bitZPVQTG9j16EpW';
    elseif ($amount === 1000)
      $price = 'price_1ObewyJ8bitZPVQTDsAJAR6l';
  } elseif ($currency === 'USD') {
    if ($amount === 5)
      $price = 'price_1ObexBJ8bitZPVQTgdR5i3xJ';
    elseif ($amount === 10)
      $price = 'price_1ObexLJ8bitZPVQT5TpcT11g';
    elseif ($amount === 20)
      $price = 'price_1ObexSJ8bitZPVQTmmWdO4Mz';
    elseif ($amount === 50)
      $price = 'price_1ObexZJ8bitZPVQTiNdfG3C0';
    elseif ($amount === 100)
      $price = 'price_1ObexfJ8bitZPVQTzY4wbRiA';
    elseif ($amount === 200)
      $price = 'price_1ObexmJ8bitZPVQTiE5ni88d';
    elseif ($amount === 500)
      $price = 'price_1ObexzJ8bitZPVQTsvN8ZDlP';
    elseif ($amount === 1000)
      $price = 'price_1Obey8J8bitZPVQTBD1rfazC';    
  } elseif ($currency === 'EUR') {
    if ($amount === 5)
      $price = 'price_1ObeyKJ8bitZPVQT5nES2jjT';
    elseif ($amount === 10)
      $price = 'price_1ObeyXJ8bitZPVQTUcEnnD4K';
    elseif ($amount === 20)
      $price = 'price_1ObeygJ8bitZPVQTzFaCozWC';
    elseif ($amount === 50)
      $price = 'price_1ObeyrJ8bitZPVQTgGSpev3l';
    elseif ($amount === 100)
      $price = 'price_1Obez3J8bitZPVQTvIDLKRAC';
    elseif ($amount === 200)
      $price = 'price_1ObezEJ8bitZPVQTDl21MiUW';
    elseif ($amount === 500)
      $price = 'price_1ObezOJ8bitZPVQTk9V8ljU1';
    elseif ($amount === 1000)
      $price = 'price_1ObezbJ8bitZPVQTns0sELxT';    
  } else
    die("Unsupported currency: $currency");
} elseif ($frequency === 'annually') {
  $mode = 'subscription';
  if ($currency === 'CHF') {
    if ($amount === 5)
      $price = '';
    elseif ($amount === 10)
      $price = '';
    elseif ($amount === 20)
      $price = '';
    elseif ($amount === 50)
      $price = '';
    elseif ($amount === 100)
      $price = '';
    elseif ($amount === 200)
      $price = '';
    elseif ($amount === 500)
      $price = '';
    elseif ($amount === 1000)
      $price = '';
  } else
    die("Unsupported currency: $currency");
} else
  die("unknown frequency: $frequency");
$checkout_session = $stripe->checkout->sessions->create([
  'ui_mode' => 'embedded',
  'line_items' => [[
    'price' => $price,
    'quantity' => 1
  ]],
  'mode' => $mode,
  'return_url' => $YOUR_DOMAIN . '/stripe/return.html?session_id={CHECKOUT_SESSION_ID}'
]);

echo json_encode(array('clientSecret' => $checkout_session->client_secret));
