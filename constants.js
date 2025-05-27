// src/constants.js

// ————————————————————————————————————————————————————————————————————————————————
// 1) backing arrays
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
// 2) read-only proxies
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
// 3) setters (to be called when you fetch from the API)
// ————————————————————————————————————————————————————————————————————————————————
export const setCities = (fetched) => {
  if (Array.isArray(fetched) && fetched.length) {
    dynamicCities.length = 0;
    dynamicCities.push(...fetched);
  }
};

export const setBusinessTypes = (fetched) => {
  if (Array.isArray(fetched) && fetched.length) {
    dynamicBusinessTypes.length = 0;
    dynamicBusinessTypes.push(...fetched);
  }
};