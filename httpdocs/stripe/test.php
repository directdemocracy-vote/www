<?php
  $headers = "From: info@directdemocracy.vote\r\n"
            ."X-Mailer: php\r\n"
            ."MIME-Version: 1.0\r\n"
            ."Content-Type: text/html; charset=UTF-8\r\n"
            ."Bcc: donate@directdemocracy.vote\r\n";
  mail("Olivier.Michel@cyberbotics.com", "Thank you for your donation!", "Hello Ducon la joie !", $headers);
