import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const WithdrawPage = () => {
  const navigate = useNavigate();

  const handleFakeWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Withdrawal Submitted!", {
      description: "Your funds will be processed within 3-5 business days.",
    });
    // Send user back to their dashboard
    navigate("/faculty"); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
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
            <Banknote className="w-6 h-6 text-accent" />
            Withdraw Your Earnings
          </CardTitle>
          <CardDescription>Enter your bank details to withdraw funds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFakeWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input id="bank-name" placeholder="Bank of America" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input id="account-number" placeholder="123456789" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routing-number">Routing Number</Label>
              <Input id="routing-number" placeholder="098765432" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Withdraw</Label>
              <Input id="amount" type="number" placeholder="$1200.00" required />
            </div>
            <Button type="submit" className="w-full" variant="success" size="lg">
              Submit Withdrawal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawPage;

