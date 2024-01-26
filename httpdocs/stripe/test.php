<?php
  $timeZone = new DateTimeZone("Europe/Zurich");
  $location = $timeZone->getLocation;
  print_r($location);
  die($location['country_code']);
?>
