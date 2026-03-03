import type { Express } from 'express';
import { createServer, type Server } from 'node:http';

interface Alert {
  id: string;
  timestamp: string;
  confidence: number;
  image_url: string;
  latitude: number;
  longitude: number;
}

let alerts: Alert[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    confidence: 0.94,
    image_url: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80',
    latitude: -2.6527,
    longitude: 37.2606,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    confidence: 0.87,
    image_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80',
    latitude: -2.6512,
    longitude: 37.2598,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    confidence: 0.73,
    image_url: 'https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=600&q=80',
    latitude: -2.654,
    longitude: 37.262,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    confidence: 0.61,
    image_url: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80',
    latitude: -2.6505,
    longitude: 37.259,
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    confidence: 0.91,
    image_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80',
    latitude: -2.653,
    longitude: 37.261,
  },
];

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/alerts', (_req, res) => {
    res.json(alerts);
  });

  app.post('/api/alerts', (req, res) => {
    const { timestamp, confidence, image_url, latitude, longitude } = req.body;
    if (!timestamp || confidence === undefined || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newAlert: Alert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      timestamp,
      confidence,
      image_url: image_url || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
    alerts.unshift(newAlert);
    return res.status(201).json(newAlert);
  });

  app.delete('/api/alerts', (_req, res) => {
    alerts = [];
    res.json({ message: 'All alerts cleared' });
  });

  app.get('/api/status', (_req, res) => {
    res.json({ status: 'online', alertCount: alerts.length });
  });

  const httpServer = createServer(app);
  return httpServer;
}
