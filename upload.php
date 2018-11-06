<?php

require 'vendor/autoload.php';

use Intervention\Image\ImageManager;

$width = 600;
$height = (int)($width * 9 / 16);

$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/bmp' => 'bmp',
    'image/gif' => 'gif',
];

$manager = new ImageManager([
    'driver' => 'gd'
]);

if (empty($_FILES)) {
    header("HTTP/1.0 400 Bad Request");
}

$output = [];

$postData = $_POST;
$filesData = $_FILES['files'];

for ($key = 0; $key < count($filesData['name']); $key++) {

    $error = $filesData['error'][$key];

    if ($error !== 0) {
        $output[$key]['error'] = $error;
        continue;
    }

    $filePath = $filesData['tmp_name'][$key];

    $image = $manager->make($filePath);

    $mime = $image->mime();

    if (empty($extensions[$mime])) {
        $output[$key]['error'] = "Not supported or unknown file extension";
        continue;
    }

    $originalWidth = $image->width();
    $originalHeight = $image->height();
    $transformationData = transformationStringToArray($postData['transformations'][$key]);

    if ($transformationData) {
        if ($transformationData['angle'] !== 0) {
            $image->rotate($transformationData['angle'] * -1);
        }
        $image->crop($transformationData['width'], $transformationData['height'], $transformationData['x'], $transformationData['y']);
    }

    $image->fit($width, $height);

    $image->save('images/'.$key.'.'.$extensions[$mime], 60);

    $output[$key]['success'] = true;
}

header('Content-Type: application/json');
echo json_encode($output);
die;

function transformationStringToArray($transformationString) {
    if ($transformationString && preg_match('!^x:([0-9]+);y:([0-9]+);w:([0-9]+);h:([0-9]+);a:([0-9-]+)$!', $transformationString, $matches)) {
        return [
            'x' => (int)$matches[1],
            'y' => (int)$matches[2],
            'width' => (int)$matches[3],
            'height' => (int)$matches[4],
            'angle' => (int)$matches[5],
        ];
    }
    return false;
}
