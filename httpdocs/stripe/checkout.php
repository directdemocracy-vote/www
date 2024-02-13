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
$timeZone = $mysqli->escape_string($_GET['timeZone']);
$test = isset($_GET['test']) ? 1 : 0;

if ($test === 1)
  require_once '../../php/stripe_test.php';
else
  require_once '../../php/stripe.php';

$stripe = new \Stripe\StripeClient($stripe_secret_key);

if ($test === 0) { # production
  if ($frequency === 'one-time') {
    $mode = 'payment';
    if ($currency === 'CHF') {
      if ($amount === 5)
        $price = 'price_1OjLd4J8bitZPVQT1y09EDwb';
      elseif ($amount === 10)
        $price = 'price_1OjLd4J8bitZPVQTRn3iDy9s';
      elseif ($amount === 20)
        $price = 'price_1OjLd4J8bitZPVQTnoYRJNnP';
      elseif ($amount === 50)
        $price = 'price_1OjLd4J8bitZPVQThpMnXPga';
      elseif ($amount === 100)
        $price = 'price_1OjLd4J8bitZPVQTSTfdkH1e';
      elseif ($amount === 200)
        $price = 'price_1OjLd4J8bitZPVQTbVDbApra';
      elseif ($amount === 500)
        $price = 'price_1OjLd4J8bitZPVQTmpqjZLoE';
      elseif ($amount === 1000)
        $price = 'price_1OjLd4J8bitZPVQT7ZdQ5lSy';
    } elseif ($currency === 'USD') {
      if ($amount === 5)
        $price = 'price_1OjLd4J8bitZPVQTZWygqmsA';
      elseif ($amount === 10)
        $price = 'price_1OjLd4J8bitZPVQTB2p2MsCV';
      elseif ($amount === 20)
        $price = 'price_1OjLd4J8bitZPVQTmqYQMWjM';
      elseif ($amount === 50)
        $price = 'price_1OjLd4J8bitZPVQTDaVqoXYF';
      elseif ($amount === 100)
        $price = 'price_1OjLd4J8bitZPVQTEZMywbTr';
      elseif ($amount === 200)
        $price = 'price_1OjLd4J8bitZPVQTno6zcTc5';
      elseif ($amount === 500)
        $price = 'price_1OjLd4J8bitZPVQT5gdwu6Ft';
      elseif ($amount === 1000)
        $price = 'price_1OjLd4J8bitZPVQTjLY9FaOx';
    } elseif ($currency === 'EUR') {
      if ($amount === 5)
        $price = 'price_1OjLd4J8bitZPVQTN04CiFpi';
      elseif ($amount === 10)
        $price = 'price_1OjLd4J8bitZPVQTGfJaZnFo';
      elseif ($amount === 20)
        $price = 'price_1OjLd4J8bitZPVQTkxkV1phY';
      elseif ($amount === 50)
        $price = 'price_1OjLd4J8bitZPVQTPu7h2vyn';
      elseif ($amount === 100)
        $price = 'price_1OjLd4J8bitZPVQTCzRoCJhl';
      elseif ($amount === 200)
        $price = 'price_1OjLd4J8bitZPVQTZYdgfffj';
      elseif ($amount === 500)
        $price = 'price_1OjLd4J8bitZPVQTIrqqrVeP';
      elseif ($amount === 1000)
        $price = 'price_1OjLd4J8bitZPVQTRGwuPZbn';
    } else
      die("Unsupported currency: $currency");
  } elseif ($frequency === 'monthly') {
    $mode = 'subscription';
    if ($currency === 'CHF') {
      if ($amount === 5)
        $price = 'price_1OjLdOJ8bitZPVQTclb3nZN1';
      elseif ($amount === 10)
        $price = 'price_1OjLdOJ8bitZPVQTwhPlHNBy';
      elseif ($amount === 20)
        $price = 'price_1OjLdOJ8bitZPVQTBGG40fH1';
      elseif ($amount === 50)
        $price = 'price_1OjLdOJ8bitZPVQTTNIQe3g0';
      elseif ($amount === 100)
        $price = 'price_1OjLdOJ8bitZPVQT1Budy5iw';
      elseif ($amount === 200)
        $price = 'price_1OjLdOJ8bitZPVQTQis1DGgC';
      elseif ($amount === 500)
        $price = 'price_1OjLdOJ8bitZPVQTJnl05Le6';
      elseif ($amount === 1000)
        $price = 'price_1OjLdOJ8bitZPVQT3ENLFlvC';
    } elseif ($currency === 'USD') {
      if ($amount === 5)
        $price = 'price_1OjLdOJ8bitZPVQT8XvSbwPd';
      elseif ($amount === 10)
        $price = 'price_1OjLdOJ8bitZPVQTp29dYShW';
      elseif ($amount === 20)
        $price = 'price_1OjLdOJ8bitZPVQTsOxSY2Zi';
      elseif ($amount === 50)
        $price = 'price_1OjLdNJ8bitZPVQTSWuD5STR';
      elseif ($amount === 100)
        $price = 'price_1OjLdNJ8bitZPVQTG8QmOQi3';
      elseif ($amount === 200)
        $price = 'price_1OjLdNJ8bitZPVQTBAQAAQFx';
      elseif ($amount === 500)
        $price = 'price_1OjLdNJ8bitZPVQTR8q9EBpi';
      elseif ($amount === 1000)
        $price = 'price_1OjLdNJ8bitZPVQTDdbIONbX';    
    } elseif ($currency === 'EUR') {
      if ($amount === 5)
        $price = 'price_1OjLdNJ8bitZPVQT6NxYe02y';
      elseif ($amount === 10)
        $price = 'price_1OjLdNJ8bitZPVQToSPCTGlE';
      elseif ($amount === 20)
        $price = 'price_1OjLdNJ8bitZPVQTVwnssTzC';
      elseif ($amount === 50)
        $price = 'price_1OjLdNJ8bitZPVQTUgzxw1Jl';
      elseif ($amount === 100)
        $price = 'price_1OjLdNJ8bitZPVQTd5OqGbGP';
      elseif ($amount === 200)
        $price = 'price_1OjLdNJ8bitZPVQTCg7p0Evj';
      elseif ($amount === 500)
        $price = 'price_1OjLdNJ8bitZPVQT19b4KIwn';
      elseif ($amount === 1000)
        $price = 'price_1OjLdNJ8bitZPVQTvZ2y1JL1';    
    } else
      die("Unsupported currency: $currency");
  } elseif ($frequency === 'annually') {
    $mode = 'subscription';
    if ($currency === 'CHF') {
      if ($amount === 5)
        $price = 'price_1OjLdGJ8bitZPVQT3oJfEOno';
      elseif ($amount === 10)
        $price = 'price_1OjLdGJ8bitZPVQThxfQrnuy';
      elseif ($amount === 20)
        $price = 'price_1OjLdGJ8bitZPVQTWylzHfOt';
      elseif ($amount === 50)
        $price = 'price_1OjLdGJ8bitZPVQTP7LVdz7O';
      elseif ($amount === 100)
        $price = 'price_1OjLdGJ8bitZPVQTKIfnaRav';
      elseif ($amount === 200)
        $price = 'price_1OjLdGJ8bitZPVQTFKJF3ljH';
      elseif ($amount === 500)
        $price = 'price_1OjLdGJ8bitZPVQTENRxUhM9';
      elseif ($amount === 1000)
        $price = 'price_1OjLdGJ8bitZPVQTaoB6WZp2';
    } elseif ($currency === 'USD') {
      if ($amount === 5)
        $price = 'price_1OjLdGJ8bitZPVQT9wO3SkcZ';
      elseif ($amount === 10)
        $price = 'price_1OjLdGJ8bitZPVQT8gz96j0T';
      elseif ($amount === 20)
        $price = 'price_1OjLdGJ8bitZPVQTzenztgRY';
      elseif ($amount === 50)
        $price = 'price_1OjLdGJ8bitZPVQTrpc1gjZE';
      elseif ($amount === 100)
        $price = 'price_1OjLdGJ8bitZPVQTMK9H1EEG';
      elseif ($amount === 200)
        $price = 'price_1OjLdGJ8bitZPVQT2Ob8j3WN';
      elseif ($amount === 500)
        $price = 'price_1OjLdGJ8bitZPVQTL22v5KYa';
      elseif ($amount === 1000)
        $price = 'price_1OjLdGJ8bitZPVQTR8HJbxOd';    
    } elseif ($currency === 'EUR') {
      if ($amount === 5)
        $price = 'price_1OjLdFJ8bitZPVQTr0zlvpVe';
      elseif ($amount === 10)
        $price = 'price_1OjLdFJ8bitZPVQTMNZJMJF9';
      elseif ($amount === 20)
        $price = 'price_1OjLdFJ8bitZPVQTOcG8TsoJ';
      elseif ($amount === 50)
        $price = 'price_1OjLdFJ8bitZPVQT74TmHY70';
      elseif ($amount === 100)
        $price = 'price_1OjLdFJ8bitZPVQTTjgZ8k4v';
      elseif ($amount === 200)
        $price = 'price_1OjLdFJ8bitZPVQTX7w5kMzM';
      elseif ($amount === 500)
        $price = 'price_1OjLdFJ8bitZPVQTc954KQDX';
      elseif ($amount === 1000)
        $price = 'price_1OjLdFJ8bitZPVQTa90vpGGx';
    } else
      die("Unsupported currency: $currency");
  } else
    die("unknown frequency: $frequency");
} else { # test
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
}
$key = bin2hex(random_bytes(20));
$query = "INSERT INTO payment(frequency, currency, amount, email, givenNames, familyName, organization, comment, display, displayGivenNames, hideAmount, timeZone, `key`, test) "
        ."VALUES('$frequency', '$currency', $amount, '$email', \"$givenNames\", \"$familyName\", \"$organization\", \"$comment\", $display, $displayGivenNames, $hideAmount, \"$timeZone\", '$key', $test)";
$mysqli->query($query) or die($mysqli->error);
$id = $mysqli->insert_id;
$mysqli->close();
$return_url = 'https://directdemocracy.vote'.($test ? '/stripe_test.html' : '').'?key='.$key;
$parameters = [
  'ui_mode' => 'embedded',
  'line_items' => [[
    'price' => $price,
    'quantity' => 1
  ]],
  'mode' => $mode,
  'customer_email' => $email,
  'consent_collection' => ['terms_of_service' => 'required'],
  'client_reference_id' => "$id",
  'redirect_on_completion' => 'if_required',
  'return_url' => $return_url
];
if ($mode === 'payment')
  $parameters['submit_type'] = 'donate';
$checkout_session = $stripe->checkout->sessions->create($parameters);

echo json_encode(array('clientSecret' => $checkout_session->client_secret, 'paymentId' => $id));
