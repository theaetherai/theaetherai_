// Debug Cloudinary signatures
require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to convert a query string into parameters object
function parseQueryString(queryString) {
  const params = {};
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value);
  }
  return params;
}

// This is the string to sign from the error message
const stringToSign = 'context={"userId":"de6b9623-2880-43b4-a89e-311537c6039a","workspaceId":"fd7ade02-8ff7-40f1-8c35-2826fe4a7c77","source":"opal-webprodigies","uploadedAt":"2025-05-04T03:00:29.314Z"}&folder=opal_videos&public_id=video_1746327629309_de6b9623-2880-43b4-a89e-311537c6039a&timestamp=1746327629309&upload_preset=video_uploads';

// The invalid signature from the error
const invalidSignature = 'bd6b1d224f0af2093a2095aba66c68477ccd5bf7';

console.log('\n--- Cloudinary Signature Debug ---\n');
console.log('String to sign:', stringToSign);
console.log('Invalid signature:', invalidSignature);

// Parse parameters from the string to sign
const params = parseQueryString(stringToSign);

// Generate a signature with our function using the exact same parameters
const correctSignature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

console.log('Correct signature:', correctSignature);
console.log('Signatures match?', correctSignature === invalidSignature);

// Try a different approach - sign raw string
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const crypto = require('crypto');
const rawSignature = crypto.createHash('sha1').update(stringToSign + apiSecret).digest('hex');

console.log('Raw string signature:', rawSignature);

console.log('\nAPI Key (first 5 chars):', process.env.CLOUDINARY_API_KEY.substring(0, 5));
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

// Double check if context needs special handling
const paramsWithParsedContext = { ...params };
if (params.context) {
  try {
    paramsWithParsedContext.context = JSON.parse(params.context);
  } catch (e) {
    console.log('Could not parse context as JSON');
  }
}

console.log('\nTrying with parsed context object:');
const signatureWithParsedContext = cloudinary.utils.api_sign_request(
  paramsWithParsedContext, 
  process.env.CLOUDINARY_API_SECRET
);
console.log('Signature with parsed context:', signatureWithParsedContext);

console.log('\nAPI Secret length:', process.env.CLOUDINARY_API_SECRET.length);
console.log('First 5 chars of API Secret:', process.env.CLOUDINARY_API_SECRET.substring(0, 5)); 