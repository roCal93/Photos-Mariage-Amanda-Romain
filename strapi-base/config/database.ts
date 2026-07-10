export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite')

  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: env('DATABASE_FILENAME', '.tmp/data.db'),
        },
        useNullAsDefault: true,
      },
    }
  }

  // Configuration PostgreSQL pour Railway
  const connection = env('DATABASE_URL')
    ? {
        // Railway fournit DATABASE_URL avec SSL activé
        connectionString: env('DATABASE_URL'),
        ssl: env('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false } // SSL requis en production
          : false,
      }
    : {
        // Configuration manuelle
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        },
      }

  return {
    connection: {
      client: 'postgres',
      connection,
      pool: {
        min: 0,
        max: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
      debug: false,
    },
  }
}
