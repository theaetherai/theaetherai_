// This file is used to configure connection pooling for Prisma in serverless environments
// Learn more: https://pris.ly/d/vercel-build

const { PrismaClient } = require('@prisma/client');

// Pool configuration
const connectionPoolConfig = {
  max: 3, // Maximum number of connections
  idle_timeout: 20, // Maximum time (in seconds) to keep an idle connection in the pool
  connect_timeout: 10, // Connection timeout in seconds
};

// Export Prisma connection pooling configuration
module.exports = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      pooling: connectionPoolConfig,
    },
  },
}; 