'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useId } from "react";
import { toast } from "sonner";

export function MechanicRatingDialog() {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState("3");
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const id = useId();

    const items = [
        { value: "1", label: "Angry", icon: "😠" },
        { value: "2", label: "Sad", icon: "🙁" },
        { value: "3", label: "Neutral", icon: "😐" },
        { value: "4", label: "Happy", icon: "🙂" },
        { value: "5", label: "Laughing", icon: "😀" },
    ];

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Here you would send the data to your backend
            console.log({ rating, review });

            // Show success message
            toast(

                "Thank you for your feedback!",
            );

            // Close dialog and reset form
            setOpen(false);
            setRating("3");
            setReview("");
        } catch (error) {
            toast(

                "There was an error submitting your review.",

            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Rate Your Mechanic</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate Your Mechanic Experience</DialogTitle>
                    <DialogDescription>
                        Please share your feedback about the service you received.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <fieldset className="space-y-4">
                        <legend className="text-sm font-medium leading-none">How would you rate your experience?</legend>
                        <RadioGroup
                            className="flex gap-1.5"
                            value={rating}
                            onValueChange={setRating}
                        >
                            {items.map((item) => (
                                <label
                                    key={`${id}-${item.value}`}
                                    className="relative flex size-9 cursor-pointer flex-col items-center justify-center rounded-full border border-input text-center text-xl shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70"
                                    title={item.label}
                                >
                                    <RadioGroupItem
                                        id={`${id}-${item.value}`}
                                        value={item.value}
                                        className="sr-only after:absolute after:inset-0"
                                    />
                                    {item.icon}
                                </label>
                            ))}
                        </RadioGroup>
                    </fieldset>

                 
                </div>

                <DialogFooter>
                  
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}