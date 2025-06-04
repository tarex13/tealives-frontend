// ── src/constants.js ──

// ————————————————————————————————————————————————————————————————————————————————
// 1) backing arrays (populated at runtime)
// ————————————————————————————————————————————————————————————————————————————————
let dynamicCities = ['toronto', 'vancouver', 'calgary', 'montreal']; // fallback default
let dynamicBusinessTypes = [
  'retail',
  'food',
  'services',
  'entertainment',
  'education',
]; // fallback—replace with your own defaults

// ————————————————————————————————————————————————————————————————————————————————
// 2) helper to reorder cities based on a “preferred” city (from localStorage or IP lookup)
// ————————————————————————————————————————————————————————————————————————————————
function reorderCities(rawList, preferredCity) {
  // Make a copy, remove duplicates, then sort alphabetically (case‐insensitive)
  const sorted = Array.from(new Set(rawList))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  if (preferredCity && typeof preferredCity === 'string') {
    const lowerPref = preferredCity.toLowerCase();
    const idx = sorted.findIndex(c => c.toLowerCase() === lowerPref);
    if (idx !== -1) {
      // Remove existing occurrence
      const [matched] = sorted.splice(idx, 1);
      // Put it at front (in lowercase form)
      sorted.unshift(matched.toLowerCase());
    } else {
      // If it’s not already in the list, just insert it at front
      sorted.unshift(lowerPref);
    }
  }

  return sorted;
}

// ————————————————————————————————————————————————————————————————————————————————
// 3) initialize dynamicCities based on localStorage.city (if any)
// ————————————————————————————————————————————————————————————————————————————————
(function initializeFromLocalStorage() {
  let stored = null;
  try {
    stored = localStorage.getItem('city');
  } catch (_) {
    stored = null;
  }

  if (stored) {
    const ordered = reorderCities(dynamicCities, stored);
    dynamicCities.length = 0;
    dynamicCities.push(...ordered);
  } else {
    // No stored city: just sort alphabetically for now
    const ordered = reorderCities(dynamicCities, null);
    dynamicCities.length = 0;
    dynamicCities.push(...ordered);
  }
})();

// ————————————————————————————————————————————————————————————————————————————————
// 4) attempt an IP-based lookup to guess the user’s city (only if none in localStorage)
//    and reorder dynamicCities accordingly
// ————————————————————————————————————————————————————————————————————————————————
;(function attemptIpLookup() {
  if (typeof window === 'undefined') return; // not in a browser
  let stored = null;
  try {
    stored = localStorage.getItem('city');
  } catch (_) {
    stored = null;
  }
  if (stored) return; // user already chose a city

  // Fetch approximate location from a public IP-geolocation API
  // (no browser “allow” pop-up; this uses the client’s IP automatically)
  fetch('https://ipapi.co/json/')
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
      if (!data || !data.city) return;
      const approx = data.city.toLowerCase();
      // Reorder dynamicCities so that approx is first (if found) or still first if not found
      const ordered = reorderCities(dynamicCities, approx);
      dynamicCities.length = 0;
      dynamicCities.push(...ordered);

      // Store this guess so next time we don’t re-query
      try {
        localStorage.setItem('city', approx);
      } catch (_) {
        // ignore private mode
      }
    })
    .catch(() => {
      // on any error, do nothing (keep the fallback ordering)
    });
})();

// ————————————————————————————————————————————————————————————————————————————————
// 5) read-only proxies
// ————————————————————————————————————————————————————————————————————————————————
export const CITIES = new Proxy(dynamicCities, {
  get(target, prop) {
    return Reflect.get(target, prop);
  },
  set() {
    throw new Error('CITIES is read-only');
  },
});

export const BUSINESS_TYPES = new Proxy(dynamicBusinessTypes, {
  get(target, prop) {
    return Reflect.get(target, prop);
  },
  set() {
    throw new Error('BUSINESS_TYPES is read-only');
  },
});

// ————————————————————————————————————————————————————————————————————————————————
// 6) setters (to be called when you fetch fresh lists from your API)
// ————————————————————————————————————————————————————————————————————————————————
export const setCities = (fetched) => {
  if (Array.isArray(fetched) && fetched.length) {
    // If there’s a stored city, use that; otherwise sort/fetch IP-guess next time
    let stored = null;
    try {
      stored = localStorage.getItem('city');
    } catch (_) {
      stored = null;
    }

    // Reorder fetched list
    const reordered = reorderCities(fetched, stored);
    dynamicCities.length = 0;
    dynamicCities.push(...reordered);
  }
};

export const setBusinessTypes = (fetched) => {
  if (Array.isArray(fetched) && fetched.length) {
    dynamicBusinessTypes.length = 0;
    dynamicBusinessTypes.push(...fetched);
  }
};
