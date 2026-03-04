<?php

declare(strict_types=1);

/**
 * Geocode Members — CSV Generator for uMap
 *
 * Accepts a CiviCRM CSV upload, geocodes each unique city via OpenStreetMap
 * Nominatim, and provides the geocoded CSV for download.
 *
 * Endpoints:
 *   POST ?action=upload              Upload CSV, parse, return stats + token
 *   GET  ?action=geocode&token=xxx   SSE stream: geocode cities with progress
 *   GET  ?action=download&token=xxx  Download the resulting CSV
 *
 * Requires: PHP 8.4+, ext-curl, ext-mbstring
 *
 * @license MIT
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const WORK_DIR         = __DIR__ . '/geocode-work';
const CACHE_FILE       = __DIR__ . '/geocode-cache.json';
const CONTACT_EMAIL    = 'Olivier.Michel@cyberbotics.com';
const REQUEST_DELAY_US = 1_100_000;   // 1.1 s between Nominatim requests
const MAX_UPLOAD_SIZE  = 10 * 1024 * 1024;  // 10 MB

// ─── Country normalisation ─────────────────────────────────────────────────

const COUNTRY_MAP = [
    'FR' => 'FR', 'FRANCE' => 'FR', 'France' => 'FR', 'france' => 'FR', 'Fr' => 'FR',
    'CH' => 'CH', 'Suisse' => 'CH',
    'Belgique' => 'BE',
    'Canada'   => 'CA',
    'Portugal' => 'PT',
    'Vietnam'  => 'VN',
    'Inde'     => 'IN',
    'Cameroon' => 'CM',
    'Taiwan'   => 'TW',
    'Rdc'      => 'CD',
    'AD'       => 'AD',
    'Benin'    => 'BJ',
    'Cambodia' => 'KH',
    'PF'       => 'PF',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

if (!is_dir(WORK_DIR)) {
    mkdir(WORK_DIR, 0755, true);
}

function jsonResponse(array $data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function loadCache(): array
{
    if (!file_exists(CACHE_FILE)) return [];
    $data = json_decode(file_get_contents(CACHE_FILE), true);
    return is_array($data) ? $data : [];
}

function saveCache(array $cache): void
{
    file_put_contents(
        CACHE_FILE,
        json_encode($cache, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
}

function cacheKey(string $city, string $postcode, string $country): string
{
    return mb_strtolower(trim("$city|$postcode|$country"));
}

function normaliseCountry(string $raw): string
{
    $trimmed = trim($raw);
    return COUNTRY_MAP[$trimmed] ?? $trimmed;
}

function normaliseDateToISO(string $date): string
{
    $parts = explode('/', trim($date));
    if (count($parts) === 3) {
        return "{$parts[2]}-{$parts[1]}-{$parts[0]}";
    }
    return $date;
}

// ─── Nominatim geocoding via curl ───────────────────────────────────────────

function nominatimRequest(array $params): array|false
{
    $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query($params);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'GeocodeMembersScript/1.0 (' . CONTACT_EMAIL . ')',
        CURLOPT_HTTPHEADER     => ['Accept-Language: fr'],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return false;
    }

    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : false;
}

function geocodeCity(string $city, string $postcode, string $country): ?array
{
    $params = [
        'city'    => $city,
        'country' => $country,
        'format'  => 'json',
        'limit'   => 1,
        'addressdetails' => 1,
    ];

    if ($postcode !== '') {
        $params['postalcode'] = $postcode;
    }

    // First attempt: with postcode
    $results = nominatimRequest($params);
    if ($results !== false && !empty($results[0]['lat']) && !empty($results[0]['lon'])) {
        $addr = $results[0]['address'] ?? [];
        $name = $addr['city'] ?? $addr['town'] ?? $addr['village'] ?? $addr['municipality'] ?? $city;
        return [
            'lat'  => (float) $results[0]['lat'],
            'lon'  => (float) $results[0]['lon'],
            'name' => $name,
        ];
    }

    // Fallback: without postcode
    unset($params['postalcode']);
    usleep(REQUEST_DELAY_US);

    $results = nominatimRequest($params);
    if ($results !== false && !empty($results[0]['lat']) && !empty($results[0]['lon'])) {
        $addr = $results[0]['address'] ?? [];
        $name = $addr['city'] ?? $addr['town'] ?? $addr['village'] ?? $addr['municipality'] ?? $city;
        return [
            'lat'  => (float) $results[0]['lat'],
            'lon'  => (float) $results[0]['lon'],
            'name' => $name,
        ];
    }

    return null;
}

// ─── CSV Parsing ────────────────────────────────────────────────────────────

function parseInputCSV(string $path): array
{
    $handle = fopen($path, 'r')
        ?: jsonResponse(['error' => 'Cannot read CSV file.'], 500);

    $headers = fgetcsv($handle, 0, ',', '"', '');
    if ($headers === false) {
        fclose($handle);
        jsonResponse(['error' => 'Empty CSV file.'], 400);
    }

    $col = array_flip($headers);
    $cityCol    = $col['City (Main Address)']      ?? null;
    $pcCol      = $col['Post Code (Main Address)']  ?? null;
    $countryCol = $col['Country (Main Address)']    ?? null;
    $dateCol    = $col['Created Date']               ?? null;

    if ($cityCol === null || $countryCol === null || $dateCol === null) {
        fclose($handle);
        jsonResponse([
            'error' => 'Missing required columns: "City (Main Address)", "Country (Main Address)", "Created Date".'
        ], 400);
    }

    $rows   = [];
    $cities = [];

    while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) {
        $city     = trim($row[$cityCol]    ?? '');
        $postcode = trim($row[$pcCol]      ?? '');
        $country  = normaliseCountry($row[$countryCol] ?? '');
        $date     = trim($row[$dateCol]    ?? '');

        if ($city === '') continue;

        $key = cacheKey($city, $postcode, $country);
        $cities[$key] = compact('city', 'postcode', 'country');
        $rows[] = [
            'key'  => $key,
            'city' => $city,
            'date' => normaliseDateToISO($date),
        ];
    }

    fclose($handle);
    return [$rows, $cities];
}

// ─── Action: Upload ─────────────────────────────────────────────────────────

function handleUpload(): never
{
    if (empty($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['error' => 'No CSV file uploaded or upload error.'], 400);
    }
    if ($_FILES['csv']['size'] > MAX_UPLOAD_SIZE) {
        jsonResponse(['error' => 'File too large (max 10 MB).'], 400);
    }

    $token      = bin2hex(random_bytes(16));
    $sessionDir = WORK_DIR . '/' . $token;
    mkdir($sessionDir, 0755, true);

    $inputPath = "$sessionDir/input.csv";
    move_uploaded_file($_FILES['csv']['tmp_name'], $inputPath);

    [$rows, $cities] = parseInputCSV($inputPath);

    $cache         = loadCache();
    $alreadyCached = count(array_filter(
        array_keys($cities),
        fn(string $key): bool => isset($cache[$key])
    ));

    file_put_contents("$sessionDir/rows.json",   json_encode($rows,   JSON_UNESCAPED_UNICODE));
    file_put_contents("$sessionDir/cities.json", json_encode($cities, JSON_UNESCAPED_UNICODE));

    $toGeocode = count($cities) - $alreadyCached;

    jsonResponse([
        'status'            => 'ok',
        'token'             => $token,
        'total_members'     => count($rows),
        'unique_cities'     => count($cities),
        'already_cached'    => $alreadyCached,
        'to_geocode'        => $toGeocode,
        'estimated_seconds' => (int) ceil($toGeocode * 1.2),
    ]);
}

// ─── Action: Geocode (SSE stream) ───────────────────────────────────────────

function handleGeocode(): never
{
    set_time_limit(900);
    ignore_user_abort(true);

    $token = $_GET['token'] ?? '';
    if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
        jsonResponse(['error' => 'Invalid token.'], 400);
    }

    $sessionDir = WORK_DIR . '/' . $token;
    if (!is_dir($sessionDir)) {
        jsonResponse(['error' => 'Session not found. Upload again.'], 404);
    }

    $cities = json_decode(file_get_contents("$sessionDir/cities.json"), true);
    $rows   = json_decode(file_get_contents("$sessionDir/rows.json"),   true);

    if (!$cities || !$rows) {
        jsonResponse(['error' => 'Corrupted session data.'], 500);
    }

    // ── Disable all buffering and compression for SSE
    @ini_set('output_buffering', 'Off');
    @ini_set('zlib.output_compression', false);

    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    header('Content-Encoding: none');
    header('X-Accel-Buffering: no');

    if (function_exists('apache_setenv')) {
        apache_setenv('no-gzip', '1');
    }

    while (ob_get_level()) ob_end_clean();

    // Push past any proxy buffer
    echo ':' . str_repeat(' ', 2048) . "\n\n";
    flush();

    $sendEvent = function (string $event, array $data): void {
        echo "event: $event\n";
        echo 'data: ' . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
        flush();
    };

    // ── Geocode loop
    $cache      = loadCache();
    $total      = count($cities);
    $done       = 0;
    $newLookups = 0;
    $failed     = [];

    foreach ($cities as $key => $loc) {
        $done++;

        if (isset($cache[$key])) {
            $sendEvent('progress', [
                'done'   => $done,
                'total'  => $total,
                'city'   => $loc['city'],
                'status' => 'cached',
            ]);
            continue;
        }

        $sendEvent('progress', [
            'done'   => $done,
            'total'  => $total,
            'city'   => $loc['city'],
            'status' => 'geocoding',
        ]);

        $result = geocodeCity($loc['city'], $loc['postcode'], $loc['country']);

        if ($result !== null) {
            $cache[$key] = $result;
            $sendEvent('progress', [
                'done'   => $done,
                'total'  => $total,
                'city'   => $loc['city'],
                'status' => 'ok',
                'lat'    => $result['lat'],
                'lon'    => $result['lon'],
            ]);
        } else {
            $cache[$key] = null;
            $failed[]    = "{$loc['city']}, {$loc['postcode']}, {$loc['country']}";
            $sendEvent('progress', [
                'done'   => $done,
                'total'  => $total,
                'city'   => $loc['city'],
                'status' => 'failed',
            ]);
        }

        $newLookups++;
        if ($done < $total) {
            usleep(REQUEST_DELAY_US);
        }
    }

    if ($newLookups > 0) {
        saveCache($cache);
    }

    // ── Build output CSV
    $outputPath = "$sessionDir/members-geocoded.csv";
    $out = fopen($outputPath, 'w');
    fputcsv($out, ['lat', 'lon', 'name']);

    $written = 0;
    $skipped = 0;

    foreach ($rows as $r) {
        $coords = $cache[$r['key']] ?? null;
        if ($coords === null) {
            $skipped++;
            continue;
        }
        fputcsv($out, [$coords['lat'], $coords['lon'], $coords['name']]);
        $written++;
    }
    fclose($out);

    $sendEvent('done', [
        'rows_written' => $written,
        'rows_skipped' => $skipped,
        'failed'       => $failed,
    ]);

    exit;
}

// ─── Action: Download ───────────────────────────────────────────────────────

function handleDownload(): never
{
    $token = $_GET['token'] ?? '';
    if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
        jsonResponse(['error' => 'Invalid token.'], 400);
    }

    $filePath = WORK_DIR . '/' . $token . '/members-geocoded.csv';
    if (!file_exists($filePath)) {
        jsonResponse(['error' => 'File not found. Run geocoding first.'], 404);
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="members-geocoded.csv"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

// ─── Router ─────────────────────────────────────────────────────────────────

match ($_GET['action'] ?? $_POST['action'] ?? '') {
    'upload'   => handleUpload(),
    'geocode'  => handleGeocode(),
    'download' => handleDownload(),
    default    => jsonResponse(['error' => 'Unknown action. Use: upload, geocode, download.'], 400),
};
