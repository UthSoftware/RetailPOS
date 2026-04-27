// Utility to generate country codes
// Can be customized based on requirements

let counter = 1;

/**
 * Generate a unique country code
 * @param {string} prefix - Optional prefix for the code (default: 'C')
 * @returns {string} Generated country code
 */
function generateCountryCode(prefix = 'C') {
  const timestamp = Date.now();
  const code = `${prefix}${timestamp}${counter}`;
  counter++;
  return code;
}

module.exports = {
  generateCountryCode
};