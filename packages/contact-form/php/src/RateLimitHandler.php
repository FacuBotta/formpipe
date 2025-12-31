<?php

namespace Formpipe\ContactForm;

/**
 * Class RateLimitHandler
 *
 * Implements a simple file-based rate limiting mechanism using a sliding window.
 * Each client is identified by a unique key (typically the IP address).
 * The request count is stored in a JSON file per client.
 *
 * This class is intended for simple setups and local testing. It is not optimized
 * for high-concurrency production environments. For distributed systems, consider Redis.
 */
class RateLimitHandler
{
  /** @var string Directory where rate limit JSON files are stored */
  private string $storageDir;

  /** @var int Maximum allowed requests per window */
  private int $limit;

  /** @var int Time window in seconds */
  private int $window;

  /**
   * RateLimitHandler constructor.
   *
   * @param string $storageDir Directory where limit files will be stored
   * @param int $limit Maximum requests allowed per time window
   * @param int $windowSeconds Time window in seconds (default 60)
   */
  public function __construct(
    string $storageDir,
    int $limit,
    int $windowSeconds = 60
  ) {
    $this->storageDir = rtrim($storageDir, '/');
    $this->limit = $limit;
    $this->window = $windowSeconds;

    // Ensure the storage directory exists
    if (!is_dir($this->storageDir)) {
      mkdir($this->storageDir, 0755, true);
    }
  }

  /**
   * Check whether a client is allowed to perform a request.
   *
   * @param string $key Unique identifier for the client (e.g., IP address)
   * @return array ['allowed' => bool, 'retryAfter' => int (if blocked)]
   */
  public function check(string $key): array
  {
    $file = $this->storageDir . '/' . md5($key) . '.json';
    $now = time();

    // Open or create the file
    $fp = @fopen($file, 'c+');
    if (!$fp) {
      // Fail-open: allow the request if the filesystem fails
      return ['allowed' => true];
    }

    // Acquire exclusive lock
    flock($fp, LOCK_EX);

    // Read existing data
    rewind($fp);
    $raw = stream_get_contents($fp);
    $data = $raw ? json_decode($raw, true) : null;

    // If no data or window expired, reset
    if (!$data || !isset($data['start'], $data['count']) || ($now - $data['start']) >= $this->window) {
      $data = [
        'start' => $now,
        'count' => 1
      ];
    } else {
      // Check if request exceeds limit
      if ($data['count'] >= $this->limit) {
        $retryAfter = $this->window - ($now - $data['start']);
        flock($fp, LOCK_UN);
        fclose($fp);

        return [
          'allowed' => false,
          'retryAfter' => max(1, $retryAfter)
        ];
      }

      // Increment request count
      $data['count']++;
    }

    // Save updated data
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data));
    fflush($fp);

    // Release lock and close file
    flock($fp, LOCK_UN);
    fclose($fp);

    return ['allowed' => true];
  }
}
