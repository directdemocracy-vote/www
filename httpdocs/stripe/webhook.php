<?php

require_once '../../vendor/autoload.php';
require_once '../../php/stripe.php';
require_once '../../php/database.php';

function error($message) {
  http_response_code(400);
  die($message);
}

function checkoutSessionCompleted($object) {
  global $mysqli;
  $amount_raw = $object->amount_total / 100;
  $amount = strtoupper($object->currency).' '.$amount_raw;
  $id = intval($object->client_reference_id);
  $email = $object->customer_email;
  $credit_card_name = $object->customer_details->name;
  $country = $object->customer_details->address->country;
  $mode = $object->mode;
  $date = intval($object->created);
  $query = "SELECT frequency, currency, amount, email, givenNames, familyName, organization, comment, display, displayGivenNames, hideAmount, paid FROM payment WHERE id=$id";
  $result = $mysqli->query($query) or error($mysqli->error);
  $payment = $result->fetch_object();
  if (!$payment)
    error("Payment $id not found");
  if ($payment->email != $object->customer_email)
    error("E-mail mismatch for client $1: $payment->email != $object->customer_email");
  if (($mode === 'payment' && $payment->frequency !== 'one-time') || ($mode === 'subscription' && $payment->frequency === 'one-time'))
    error("Frequency mismatch for client $1: $object->mode for $payment->frequency");
  if ($payment->amount != $amount_raw)
    error("Payment amount mismatch for client $1: $amount_raw != $payment->amount");
  if ($object->payment_status !== 'paid')
    error("Expecting payment status to be 'paid', but got '$object->payment_status'");
  if ($object->status !== 'complete')
    error("Expecting status to be 'complete', but got '$object->status'");
  $mysqli->query("UPDATE payment SET country=\"$country\", paid=FROM_UNIXTIME($date) WHERE id=$id") or error($mysqli->error);
  $name = ($payment->organization === '') ? $payment->givenNames.' '.$payment->familyName : $payment->organization;
  $summary = "<table>";
  if ($payment->organization === '')
    $summary.= "<tr><td>Given Name(s): </td><td>$payment->givenNames</td></tr><tr><td>Family Name: </td><td>$payment->familyName</td></tr>";
  else
    $summary.= "<tr><td>Organization: </td><td>$payment->organization</td></tr>";
  $summary.= "<tr><td>Country: </td><td>$country</td></tr>"
            ."<tr><td>Paid Amount: </td><td>$amount</td></tr>"
            ."<tr><td>Frequency: </td><td>$payment->frequency</td></tr>";
  if ($payment->comment !== '')
    $summary.= "<tr><td>Comment: </td><td>$payment->comment</td></tr>";
  $options = '';
  if ($payment->display == 1) {
    $options.= ($payment->comment != '') ? "display donation and comment, " : "display donation, ";
    if ($payment->displayGivenNames == 1)
      $options.= "display given names instead of full name, ";
    if ($payment->hideAmount == 1)
      $options.= "hide donation amount, ";
  }
  if ($options !== '')
    $summary.= "<tr><td>Options: </td><td>".substr($options, 0, -2)."</td></tr>";
  date_default_timezone_set('Europe/Zurich');
  $summary.="<tr><td>Date: </td><td>".date('r', $date)."</td></tr>";
  $summary.="</table>";
  $message = "Dear $name,<br><br>"
            ."Thank you for donating $amount to support <a href=\"https://directdemocracy.vote\" target=\"_blank\">directdemocracy.vote</a>!<br>"
            ."Your contribution will help us to advance direct democracy everywhere in the world.<br>"
            ."If you have any question regarding your donation, please contact us by replying to this e-mail.<br><br>"
            ."Best regards,<br><br>"
            ."directdemocracy.vote<br><br><i>Summary of your donation to directdemocracy.vote:</i><br><br>$summary";
  $headers = "From: info@directdemocracy.vote\r\n"
            ."X-Mailer: php\r\n"
            ."MIME-Version: 1.0\r\n"
            ."Content-Type: text/html; charset=UTF-8\r\n"
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
  error("Error parsing payload: ".$e->getMessage());
} catch(\Stripe\Exception\SignatureVerificationException $e) {
  error("Error verifying webhook signature: ".$e->getMessage());
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
