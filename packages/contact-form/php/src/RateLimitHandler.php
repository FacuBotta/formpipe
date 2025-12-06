<?php

namespace Formpipe\ContactForm;

class RateLimitHandler
{
  /** @var \Redis|null */
  private $redis;
  private const RATE_LIMIT_PREFIX = 'formpipe_rl_';
  private const WINDOW_SECONDS = 60;

  /**
   * @param \Redis|null $redis Redis connection instance (optional)
   */
  public function __construct($redis = null)
  {
    $this->redis = $redis;
    if ($redis !== null) {
      $this->ensureRedisConnection();
    }
  }

  /**
   * Checks if client has exceeded rate limit
   *
   * @param string $clientIP Client IP address
   * @param int $limit Maximum requests allowed
   * @return array ['allowed' => bool, 'remaining' => int, 'resetIn' => int]
   */
  public function checkLimit(string $clientIP, int $limit): array
  {
    try {
      if ($this->isRedisAvailable()) {
        return $this->checkLimitWithRedis($clientIP, $limit);
      }
      return $this->checkLimitWithSession($clientIP, $limit);
    } catch (\Exception $e) {
      // On error, allow the request
      return ['allowed' => true, 'remaining' => $limit, 'resetIn' => self::WINDOW_SECONDS];
    }
  }

  private function isRedisAvailable(): bool
  {
    if ($this->redis === null) {
      return false;
    }

    try {
      return @$this->redis->ping();
    } catch (\Exception $e) {
      return false;
    }
  }

  private function ensureRedisConnection(): void
  {
    if ($this->redis === null) {
      return;
    }

    try {
      if (!@$this->redis->ping()) {
        throw new \Exception("Redis not responding");
      }
    } catch (\Exception $e) {
      $this->redis = null;
    }
  }

  private function checkLimitWithRedis(string $clientIP, int $limit): array
  {
    $key = self::RATE_LIMIT_PREFIX . hash('sha256', $clientIP);
    $now = time();

    try {
      $data = $this->redis->hGetAll($key);

      if (empty($data)) {
        $this->redis->hSet($key, 'first_request', $now);
        $this->redis->hSet($key, 'count', 1);
        $this->redis->expire($key, self::WINDOW_SECONDS + 60);
        return ['allowed' => true, 'remaining' => $limit - 1, 'resetIn' => self::WINDOW_SECONDS];
      }

      $first = (int)$data['first_request'];
      $count = (int)$data['count'];
      $elapsed = $now - $first;

      if ($elapsed > self::WINDOW_SECONDS) {
        $this->redis->del($key);
        $this->redis->hSet($key, 'first_request', $now);
        $this->redis->hSet($key, 'count', 1);
        $this->redis->expire($key, self::WINDOW_SECONDS + 60);
        return ['allowed' => true, 'remaining' => $limit - 1, 'resetIn' => self::WINDOW_SECONDS];
      }

      if ($count >= $limit) {
        return ['allowed' => false, 'remaining' => 0, 'resetIn' => self::WINDOW_SECONDS - $elapsed];
      }

      $this->redis->hIncr($key, 'count', 1);
      return ['allowed' => true, 'remaining' => $limit - $count - 1, 'resetIn' => self::WINDOW_SECONDS - $elapsed];
    } catch (\Exception $e) {
      return ['allowed' => true, 'remaining' => $limit, 'resetIn' => self::WINDOW_SECONDS];
    }
  }

  private function checkLimitWithSession(string $clientIP, int $limit): array
  {
    $this->initializeSessionSafely();

    $key = self::RATE_LIMIT_PREFIX . hash('sha256', $clientIP);
    $now = time();

    if (!isset($_SESSION['formpipe_rate_limits'][$key])) {
      $_SESSION['formpipe_rate_limits'][$key] = ['first_request' => $now, 'count' => 1];
      return ['allowed' => true, 'remaining' => $limit - 1, 'resetIn' => self::WINDOW_SECONDS];
    }

    $data = &$_SESSION['formpipe_rate_limits'][$key];
    $elapsed = $now - $data['first_request'];

    if ($elapsed > self::WINDOW_SECONDS) {
      $data = ['first_request' => $now, 'count' => 1];
      return ['allowed' => true, 'remaining' => $limit - 1, 'resetIn' => self::WINDOW_SECONDS];
    }

    if ($data['count'] >= $limit) {
      return ['allowed' => false, 'remaining' => 0, 'resetIn' => self::WINDOW_SECONDS - $elapsed];
    }

    $data['count']++;
    return ['allowed' => true, 'remaining' => $limit - $data['count'], 'resetIn' => self::WINDOW_SECONDS - $elapsed];
  }

  private function initializeSessionSafely(): void
  {
    if (session_status() === PHP_SESSION_NONE) {
      @session_start();
    }
  }

  /**
   * Closes Redis connection if available
   */
  public function closeConnection(): void
  {
    if ($this->redis !== null && $this->isRedisAvailable()) {
      try {
        @$this->redis->close();
      } catch (\Exception $e) {
        // Silence errors when closing
      }
    }
  }
}
