<?php

mail('Olivier.Michel@cyberbotics.com', 'This is a test', 'Yes', 'From: info@directdemocracy.vote');

die("OK");

require_once '../../vendor/autoload.php';
require_once '../../php/stripe.php';

function paymentIntentSucceeded($paymentIntent) {
  mail('Olivier.Michel@cyberbotics.com', 'DirectDemocracy Donation Intent', 'Yes', 'From: info@cyberbotics.com');
}

function paymentMethodAttached($paymentMethod) {
  mail('Olivier.Michel@cyberbotics.com', 'DirectDemocracy Donation Method', 'Yes', 'From: info@cyberbotics.com');
}

\Stripe\Stripe::setApiKey($stripe_secret_key);
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$event = null;
try {
  $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $stripe_end_point_secret);
} catch(\UnexpectedValueException $e) {
  http_response_code(400);
  die(json_encode(['Error parsing payload: ' => $e->getMessage()]));
} catch(\Stripe\Exception\SignatureVerificationException $e) {
  http_response_code(400);
  die(json_encode(['Error verifying webhook signature: ' => $e->getMessage()]));
}

switch ($event->type) {
  case 'payment_intent.succeeded':
    $paymentIntent = $event->data->object; // contains a \Stripe\PaymentIntent
    paymentIntentSucceeded($paymentIntent);
    break;
  case 'payment_method.attached':
    $paymentMethod = $event->data->object; // contains a \Stripe\PaymentMethod
    paymentMethodAttached($paymentMethod);
    break;
  default:
    echo 'Received unknown event type ' . $event->type;
}
http_response_code(200);
?>
