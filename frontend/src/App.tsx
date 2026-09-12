import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function App() {
  return (
    <section id="center" className="flex min-h-screen items-center justify-center">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold underline">FraudGuard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Badge>Transaction Risk & Explainability Engine</Badge>
          <Button>Click</Button>
        </CardContent>
      </Card>
    </section>
  );
}

export default App;
