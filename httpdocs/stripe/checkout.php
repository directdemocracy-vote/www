<?php

require_once '../../vendor/autoload.php';
require_once '../../php/database.php';

header('Content-Type: application/json');

$amount = intval($_GET['amount']);
$frequency = $_GET['frequency'];
$currency = $_GET['currency'];
$email = $mysqli->escape_string($_GET['email']);
$givenNames = $mysqli->escape_string($_GET['givenNames']);
$familyName = $mysqli->escape_string($_GET['familyName']);
$organization = $mysqli->escape_string($_GET['organization']);
$comment = $mysqli->escape_string($_GET['comment']);
$display = intval($_GET['display']);
$displayGivenNames = intval($_GET['displayGivenNames']);
$hideAmount = intval($_GET['hideAmount']);
$test = isset($_GET['test']) ? 1 : 0;

if ($test === 1)
  require_once '../../php/stripe_test.php';
else
  require_once '../../php/stripe.php';

$stripe = new \Stripe\StripeClient($stripe_secret_key);

if ($frequency === 'one-time') {
  $mode = 'payment';
  if ($currency === 'CHF') {
    if ($amount === 5)
      $price = 'price_1OblLsJ8bitZPVQTSa9zT0ev';
    elseif ($amount === 10)
      $price = 'price_1OblMSJ8bitZPVQTug8UBRXE';
    elseif ($amount === 20)
      $price = 'price_1OblN9J8bitZPVQTZctP0VHg';
    elseif ($amount === 50)
      $price = 'price_1OblNbJ8bitZPVQT46vMWilQ';
    elseif ($amount === 100)
      $price = 'price_1OblO0J8bitZPVQTf3brslO7';
    elseif ($amount === 200)
      $price = 'price_1OblOEJ8bitZPVQTz2eigJsw';
    elseif ($amount === 500)
      $price = 'price_1OblOQJ8bitZPVQT47OKuSf3';
    elseif ($amount === 1000)
      $price = 'price_1OblP2J8bitZPVQTTdXT8uLI';
  } elseif ($currency === 'USD') {
    if ($amount === 5)
      $price = 'price_1OblPIJ8bitZPVQTeZp7D0ro';
    elseif ($amount === 10)
      $price = 'price_1OblPUJ8bitZPVQTu1KVhWZB';
    elseif ($amount === 20)
      $price = 'price_1OblPbJ8bitZPVQTfciyO0DV';
    elseif ($amount === 50)
      $price = 'price_1OblPhJ8bitZPVQTLe7pyLqJ';
    elseif ($amount === 100)
      $price = 'price_1OblPoJ8bitZPVQTnUEWLOKF';
    elseif ($amount === 200)
      $price = 'price_1OblPvJ8bitZPVQTbvvjoJQi';
    elseif ($amount === 500)
      $price = 'price_1OblQ4J8bitZPVQTITYvuwop';
    elseif ($amount === 1000)
      $price = 'price_1OblQBJ8bitZPVQTyjQFKQwH';
  } elseif ($currency === 'EUR') {
    if ($amount === 5)
      $price = 'price_1OblQQJ8bitZPVQT3HShagD7';
    elseif ($amount === 10)
      $price = 'price_1OblQfJ8bitZPVQTNc6X69N5';
    elseif ($amount === 20)
      $price = 'price_1OblQrJ8bitZPVQTSzUy56St';
    elseif ($amount === 50)
      $price = 'price_1OblR4J8bitZPVQTCDF6PnFN';
    elseif ($amount === 100)
      $price = 'price_1OblRMJ8bitZPVQTEaJz1SfY';
    elseif ($amount === 200)
      $price = 'price_1OblRYJ8bitZPVQT0WcSWCGW';
    elseif ($amount === 500)
      $price = 'price_1OblRjJ8bitZPVQTboGHMtZ7';
    elseif ($amount === 1000)
      $price = 'price_1OblRuJ8bitZPVQTB6zmCbUo';
  } else
    die("Unsupported currency: $currency");
} elseif ($frequency === 'monthly') {
  $mode = 'subscription';
  if ($currency === 'CHF') {
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
      $price = 'price_1Obh1yJ8bitZPVQTLoC7NtcK';
    elseif ($amount === 10)
      $price = 'price_1Obh4bJ8bitZPVQTVCCDuo8y';
    elseif ($amount === 20)
      $price = 'price_1Obh4vJ8bitZPVQTp5DnuKDV';
    elseif ($amount === 50)
      $price = 'price_1Obh5CJ8bitZPVQTclMcdYov';
    elseif ($amount === 100)
      $price = 'price_1Obh5eJ8bitZPVQTFKUVX6ti';
    elseif ($amount === 200)
      $price = 'price_1Obh5rJ8bitZPVQTiROWGSic';
    elseif ($amount === 500)
      $price = 'price_1Obh62J8bitZPVQTL4rBpI29';
    elseif ($amount === 1000)
      $price = 'price_1Obh6FJ8bitZPVQTx69TmkQA';
  } elseif ($currency === 'USD') {
    if ($amount === 5)
      $price = 'price_1Obh6VJ8bitZPVQTZCOAFrfQ';
    elseif ($amount === 10)
      $price = 'price_1Obh6dJ8bitZPVQThOdjqT0w';
    elseif ($amount === 20)
      $price = 'price_1Obh6nJ8bitZPVQTtcDpEHua';
    elseif ($amount === 50)
      $price = 'price_1Obh6wJ8bitZPVQTtmZzyIfW';
    elseif ($amount === 100)
      $price = 'price_1Obh76J8bitZPVQTQnGwkFG3';
    elseif ($amount === 200)
      $price = 'price_1Obh7EJ8bitZPVQTLaU9HppQ';
    elseif ($amount === 500)
      $price = 'price_1Obh7NJ8bitZPVQTgIU5IJe5';
    elseif ($amount === 1000)
      $price = 'price_1Obh7WJ8bitZPVQTmmy2aSmv';    
  } elseif ($currency === 'EUR') {
    if ($amount === 5)
      $price = 'price_1Obh7nJ8bitZPVQTEG5Gi2v4';
    elseif ($amount === 10)
      $price = 'price_1Obh80J8bitZPVQTL2thTq5J';
    elseif ($amount === 20)
      $price = 'price_1Obh8DJ8bitZPVQTjCWEatyz';
    elseif ($amount === 50)
      $price = 'price_1Obh8SJ8bitZPVQTlJx8hhCA';
    elseif ($amount === 100)
      $price = 'price_1Obh8hJ8bitZPVQTXyMelHRD';
    elseif ($amount === 200)
      $price = 'price_1Obh8tJ8bitZPVQTGqXx1BnY';
    elseif ($amount === 500)
      $price = 'price_1Obh95J8bitZPVQTJGllpVMT';
    elseif ($amount === 1000)
      $price = 'price_1Obh9MJ8bitZPVQT2u7ajJoM';
  } else
    die("Unsupported currency: $currency");
} else
  die("unknown frequency: $frequency");
$query = "INSERT INTO payment(frequency, currency, amount, email, givenNames, familyName, organization, comment, display, displayGivenNames, hideAmount, test) "
        ."VALUES('$frequency', '$currency', $amount, '$email', \"$givenNames\", \"$familyName\", \"$organization\", \"$comment\", $display, $displayGivenNames, $hideAmount, $test)";
$mysqli->query($query) or die($mysqli->error);
$id = $mysqli->insert_id;
$mysqli->close();
$parameters = [
  'ui_mode' => 'embedded',
  'line_items' => [[
    'price' => $price,
    'quantity' => 1
  ]],
  'mode' => $mode,
  'customer_email' => $email,
  'client_reference_id' => "$id",
  'redirect_on_completion' => 'never'  
];
if ($mode === 'payment')
  $parameters['submit_type'] = 'donate';
$checkout_session = $stripe->checkout->sessions->create($parameters);

echo json_encode(array('clientSecret' => $checkout_session->client_secret, 'paymentId' => $id));
