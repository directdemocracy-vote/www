<?php

require_once '../../vendor/autoload.php';
require_once '../../secrets.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);
header('Content-Type: application/json');

$YOUR_DOMAIN = 'https://directdemocracy.vote';

$amount = intval($_GET['amount']);
$frequency = $_GET['frequency'];
if ($frequency === 'one-time') {
  $mode = 'purchase';  // FIXME
} elseif ($frequency === 'monthly') {
  $mode = 'subscription';
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
} elseif ($frequency === 'annually') {
  $mode = 'subscription';  
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
