<?php

require_once '../php/database.php';
header("Content-Type: application/json");
$test = isset($_GET['test']) ? 1 : 0;
$result = $mysqli->query("SELECT givenNames, familyName, organization, frequency, currency, amount, comment, paid, displayGivenNames, hideAmount, country FROM payment WHERE display=1 AND test=$test AND paid!='0000-00-00 00:00:00' ORDER BY paid") or die($mysqli->error);
$payments = [];
while($payment = $result->fetch_assoc()) {
  if ($payment['displayGivenNames'] == 1)
    $payment['familyName'] = '';
  if ($payment['hideAmount'] == 1)
    $payment['amount'] = 0;
  unset($payment['displayGivenNames']);
  unset($payment['hideAmount']);
  $payments[] = $payment;
}
die(json_encode($payments, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
?>
