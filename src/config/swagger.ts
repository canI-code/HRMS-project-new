import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '@/config/environment';

const apiBase = `/api/${config.apiVersion}`;

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise HRMS API',
      version: config.apiVersion,
      description: 'API documentation for Enterprise HRMS',
    },
    servers: [
      { url: `http://localhost:${config.port}${apiBase}` },
    ],
    tags: [
      { name: 'auth', description: 'Authentication and session management' },
      { name: 'employees', description: 'Employee management' },
      { name: 'attendance', description: 'Attendance and shifts' },
      { name: 'leaves', description: 'Leave requests and balances' },
      { name: 'payroll', description: 'Salary structures and payroll runs' },
      { name: 'performance', description: 'Goals and reviews' },
      { name: 'documents', description: 'Document storage and policies' },
      { name: 'notifications', description: 'Notification templates and delivery' },
    ],
  },
  // You can add route files with JSDoc annotations here later
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
