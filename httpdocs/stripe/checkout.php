<?php

require_once '../../vendor/autoload.php';
require_once '../../secrets.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);
header('Content-Type: application/json');

$YOUR_DOMAIN = 'https://directdemocracy.vote';

$checkout_session = $stripe->checkout->sessions->create([
  'ui_mode' => 'embedded',
  'line_items' => [[
    'price' => 'price_1OaKzgJ8bitZPVQTvUtbfTZn',
    'quantity' => 1
  ]],
  'mode' => 'subscription',
  # 'submit_type' => 'donate',
  'return_url' => $YOUR_DOMAIN . '/stripe/return.html?session_id={CHECKOUT_SESSION_ID}'
]);

echo json_encode(array('clientSecret' => $checkout_session->client_secret));
