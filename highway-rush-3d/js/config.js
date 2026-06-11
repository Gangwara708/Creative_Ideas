/* ============================================================
 * Highway Rush 3D — config & tuning constants
 * Original arcade driving game. All balance numbers live here.
 * ============================================================ */
window.CFG = {
  // --- Road ---
  LANES: 4,
  LANE_WIDTH: 3.4,
  ROAD_LENGTH: 400,          // visible scrolling strip
  SHOULDER: 2.2,

  // --- Track segments (curves) ---
  SEG_LEN: 5,                // metres per road segment
  SEG_COUNT: 72,             // ring buffer size (must stay divisible by 12)
  REAR_M: 45,                // road kept behind the player (reverse headroom)
  CURVE_PULL: 1.0,           // how hard curves drag you outward

  // --- Player car ---
  MAX_SPEED: 62,             // m/s (~220 km/h on the speedo)
  NITRO_SPEED: 80,
  ACCEL: 18,
  BRAKE: 36,
  DRAG: 6,                   // passive slowdown
  STEER_SPEED: 14,           // lateral m/s at full speed
  IDLE_SPEED: 10,            // auto-cruise speed with no input
  REVERSE_MAX: 9,            // top speed in reverse gear

  // --- Nitro ---
  NITRO_MAX: 100,
  NITRO_BURN: 38,            // per second while boosting
  NITRO_REGEN: 7,            // per second passive
  NITRO_NEAR_MISS: 14,       // bonus per near miss

  // --- Traffic ---
  TRAFFIC_BASE_SPEED: 22,
  TRAFFIC_SPEED_VAR: 8,
  SPAWN_AHEAD: 220,          // spawn distance in front of player
  DESPAWN_BEHIND: 30,
  SPAWN_INTERVAL_START: 1.5, // seconds between spawns at start
  SPAWN_INTERVAL_MIN: 0.55,  // hardest difficulty
  DIFFICULTY_RAMP: 90,       // seconds to reach hardest spawn rate

  // --- Scoring ---
  SCORE_PER_M: 1,            // points per metre travelled
  NEAR_MISS_BONUS: 150,
  NEAR_MISS_DIST: 2.3,       // lateral metres that count as "near"
  COIN_VALUE: 50,
  COIN_SPAWN_CHANCE: 0.45,   // per spawn tick

  // --- Ramps & blockers ---
  RAMP_LENGTH: 4.2,
  RAMP_HEIGHT: 1.5,
  JUMP_VY: 11,               // launch vertical speed at full pace
  JUMP_GRAVITY: 20,
  JUMP_BONUS: 120,
  OBSTACLE_INTERVAL: 3.2,    // average seconds between obstacle spawns
  RAMP_SHARE: 0.45,          // fraction of obstacles that are ramps
  BLOCKER_DAMAGE: 18,

  // --- Damage ---
  MAX_HEALTH: 100,
  CRASH_DAMAGE: 34,          // head-on with traffic
  SCRAPE_DAMAGE: 12,         // glancing hit
  CRASH_SLOWDOWN: 0.35,      // speed multiplier after a crash
  INVULN_TIME: 1.2,          // seconds of grace after a hit

  // --- Collision boxes (half-extents) ---
  CAR_HALF_W: 1.05,
  CAR_HALF_L: 2.3,
};
