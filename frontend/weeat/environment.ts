export const environment = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    production: process.env.NODE_ENV === 'production',
    development: process.env.NODE_ENV === 'development',
  };
  
  export default environment;