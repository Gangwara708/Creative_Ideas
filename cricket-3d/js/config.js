/* ============================================================
 * Super Over Cricket 3D
 * Original game — config & tuning constants
 * All gameplay tuning lives here so balance is easy to tweak.
 * ============================================================ */
window.CFG = {
  // --- Field geometry (units ~ metres) ---
  FIELD_RADIUS: 64,
  BOUNDARY_RADIUS: 62,      // rope sits just inside the painted edge
  PITCH_LENGTH: 20,
  PITCH_HALF: 10,           // stumps at z = +10 (striker) and z = -10 (bowler)
  PITCH_WIDTH: 3,
  STRIKER_Z: 10,
  BOWLER_Z: -10,
  BAT_CONTACT_Z: 8.6,       // where the bat meets the ball
  BALL_RADIUS: 0.36,

  // --- Ball flight / physics ---
  GRAVITY: 19.5,
  BOWL_SPEED_MIN: 23,       // z-velocity at release (arcade pace)
  BOWL_SPEED_MAX: 30,
  RELEASE_HEIGHT: 2.05,
  RELEASE_VY: -1.2,
  BOUNCE_RESTITUTION: 0.62,
  ROLL_FRICTION: 0.78,      // per second ground drag

  // --- Batting feel ---
  SWING_WINDOW_MS: 150,     // how long a swing stays "live"
  PERFECT_MS: 45,           // timing error under this = perfect
  GOOD_MS: 95,              // under this = good
  AIM_SPEED: 1.9,           // radians/sec the aim sweeps
  AIM_MAX: 1.15,            // max aim angle each side (radians)
  HIT_POWER_GROUND: 30,
  HIT_POWER_LOFT: 26,
  LOFT_VY: 16,
  FLAT_VY: 4.5,

  // --- Match defaults ---
  OVERS: 2,
  WICKETS: 5,

  // --- Fielding ---
  CATCH_RADIUS: 6.5,        // a fielder within this of the landing point can attempt a catch
  CATCH_SKILL: 0.55,        // base catch probability when in range (aerial)

  // --- AI batting (innings 2 chase) ---
  AI_SKILL: 0.62,           // chance AI middles the ball
};
