<?php

namespace Formpipe\ContactForm;

class RateLimitHandler
{
  private string $storageDir;
  private int $limit;
  private int $window;

  public function __construct(
    string $storageDir,
    int $limit,
    int $windowSeconds = 60
  ) {
    $this->storageDir = rtrim($storageDir, '/');
    $this->limit = $limit;
    $this->window = $windowSeconds;

    if (!is_dir($this->storageDir)) {
      mkdir($this->storageDir, 0755, true);
    }
  }

  public function check(string $key): array
  {
    $file = $this->storageDir . '/' . md5($key) . '.json';
    $now = time();

    $fp = @fopen($file, 'c+');
    if (!$fp) {
      // Fail-open si el filesystem falla
      return ['allowed' => true];
    }

    flock($fp, LOCK_EX);

    rewind($fp);
    $raw = stream_get_contents($fp);
    $data = $raw ? json_decode($raw, true) : null;

    if (
      !$data ||
      !isset($data['start'], $data['count']) ||
      ($now - $data['start']) >= $this->window
    ) {
      // Nueva ventana
      $data = [
        'start' => $now,
        'count' => 1
      ];
    } else {
      if ($data['count'] >= $this->limit) {
        $retryAfter = $this->window - ($now - $data['start']);
        flock($fp, LOCK_UN);
        fclose($fp);

        return [
          'allowed' => false,
          'retryAfter' => max(1, $retryAfter)
        ];
      }

      $data['count']++;
    }

    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data));
    fflush($fp);

    flock($fp, LOCK_UN);
    fclose($fp);

    return ['allowed' => true];
  }
}
