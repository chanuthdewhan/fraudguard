import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('Server is healthy');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
