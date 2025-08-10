/**
 * Vercel Serverless Function Entry Point
 * Import the compiled Express app and export as handler
 */

import app from '../dist/app.js';

// Export the Express app as default for Vercel
export default app;