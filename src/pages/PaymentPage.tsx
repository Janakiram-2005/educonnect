import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PaymentPage = () => {
  const navigate = useNavigate();

  const handleFakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Payment Successful!", {
      description: "Your subscription has been activated.",
    });
    // Send user back to their dashboard
    // In a real app, you might check userType from localStorage
    navigate("/student"); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground mb-2 -ml-4" // Align left
            onClick={() => navigate(-1)} // Go back to the previous page
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardTitle className="text-2xl flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Complete Your Payment
          </CardTitle>
          <CardDescription>Enter your (fake) payment details to subscribe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFakePayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Name on Card</Label>
              <Input id="card-name" placeholder="Your Name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="4242 4242 4242 4242" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Input id="expiry" placeholder="MM/YY" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" required />
              </div>
            </div>
            <Button type="submit" className="w-full" variant="success" size="lg">
              Pay $29.99
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;

