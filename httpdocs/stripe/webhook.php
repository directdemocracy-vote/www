<?php
require_once '../../vendor/autoload.php';
require_once '../../php/stripe.php';

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
    handlePaymentIntentSucceeded($paymentIntent);
    break;
  case 'payment_method.attached':
    $paymentMethod = $event->data->object; // contains a \Stripe\PaymentMethod
    handlePaymentMethodAttached($paymentMethod);
    break;
  // ... handle other event types
  default:
    echo 'Received unknown event type ' . $event->type;
}
http_response_code(200);
?>
