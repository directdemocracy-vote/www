<?php

require_once '../../vendor/autoload.php';
require_once '../../secrets.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);
header('Content-Type: application/json');

$YOUR_DOMAIN = 'https://directdemocracy.vote';

$checkout_session = $stripe->checkout->sessions->create([
  'ui_mode' => 'embedded',
  'customer_email' => 'customer@example.com',
  'submit_type' => 'donate',
  'billing_address_collection' => 'required',
  'shipping_address_collection' => [
    'allowed_countries' => ['US', 'CH'],
  ],
  'line_items' => [[
    # Provide the exact Price ID (e.g. pr_1234) of the product you want to sell
    'price' => 'price_1OaKs1J8bitZPVQTlDszgDpK',
    'quantity' => 1
  ]],
  'mode' => 'subscription',
  'return_url' => $YOUR_DOMAIN . '/stripe/return.html?session_id={CHECKOUT_SESSION_ID}',
  'automatic_tax' => [
    'enabled' => true,
  ],
]);

echo json_encode(array('clientSecret' => $checkout_session->client_secret));
