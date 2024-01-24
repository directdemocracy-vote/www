<?php

require_once '../../vendor/autoload.php';
require_once '../../php/stripe.php';

function checkoutSessionCompleted($object) {
  $amount = strtoupper($object->currency).' '.($object->amount_total / 100);
  $id = $object->client_reference_id;
  $email = $object->customer_email;
  $name = $object->customer_details->name;
  $country = $object->customer_details->address->country;
  $mode = $object->mode; # payment or subscription
  $status = $object->payment_status; # should be "paid"
  $message = "Dear $name,<br><br>"
            ."Thank you for donating $amount to support <a href=\"https://directdemocracy.vote\" target="_blank">directdemocracy.vote</a>!<br><br>"
            ."Best regards,<br><br>"
            ."directdemocracy.vote";
  $headers = "From: info@directdemocracy.vote\r\n"
            ."X-Mailer: php\r\n"
            ."MIME-Version: 1.0\r\n"
            ."Content-Type: text/html; charset=UTF-8\r\n";
            ."Bcc: Olivier.Michel@cyberbotics.com\r\n";
  mail($email, "Thank you for your donation!", $message, $headers);
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
  case 'checkout.session.completed':
    checkoutSessionCompleted($event->data->object);
    break;
  default:
    mail('Olivier.Michel@cyberbotics.com', "Unknown Stripe event received: $event->type", $payload, 'From: info@directdemocracy.vote');
    echo 'Received unknown event type ' . $event->type;
}
http_response_code(200);
?>
