import { Heart } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const DonatePage = () => {
  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="max-w-2xl w-full text-center">
        <Heart className="size-12 text-primary mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Support A-Station
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          A-Station is an open-source project. Your support helps us keep
          building and improving.
        </p>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Donate</CardTitle>
            <CardDescription>
              Donation options coming soon. Thank you for your interest in
              supporting the project!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
