// constants.js
let dynamicCities = ['toronto', 'vancouver', 'calgary', 'montreal']; // fallback default

// Exported like a normal array — nothing changes for the rest of your app
export const CITIES = new Proxy(dynamicCities, {
  get(target, prop) {
    return Reflect.get(target, prop);
  },
  set() {
    throw new Error('CITIES is read-only');
  }
});

// Used once at startup to populate from DB
export const setCities = (fetchedCities) => {
  if (Array.isArray(fetchedCities) && fetchedCities.length > 0) {
    dynamicCities.length = 0;
    dynamicCities.push(...fetchedCities);
  }
};
