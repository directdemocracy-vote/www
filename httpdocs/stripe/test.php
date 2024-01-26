<?php
  $timeZone = new DateTimeZone("Europe/Zurich");
  $country = $timeZone->country_code;
  print_r($timeZone);
  die($country);
?>
