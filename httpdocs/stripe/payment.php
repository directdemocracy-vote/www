<?php
require_once '../../php/database.php';

header("Content-Type: application/json");

$key = $mysqli->escape_string($_GET['key']);
$result = $mysqli->query("SELECT * FROM payment WHERE key='$key'") or die(mysqli->error);
$payment = $result->fetch_assoc();
if ($payment)
  die(json_encode($payment, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
else
  die('"error":"Payment not found"');
?>
