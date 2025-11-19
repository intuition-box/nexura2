import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CampaignCreate() {
	const [, setLocation] = useLocation();

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold">Create Campaign</h1>
			<p className="text-sm text-muted-foreground mt-2">This is a placeholder page for creating an organization-level campaign.</p>

			<div className="mt-6">
				<Button onClick={() => setLocation("/campaigns")}>Back to campaigns</Button>
			</div>
		</div>
	);
}
