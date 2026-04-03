import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Check your inbox</CardTitle>
            <CardDescription>
              We sent you a magic link. Click it to sign in to ContentAI Studio.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
