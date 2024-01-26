<?php
  $timeZone = new DateTimeZone("Europe/Zurich");
  $location = timezone_location_get($timeZone);
  print_r($location);
  die($location['country_code']);
?>
